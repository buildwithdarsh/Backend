import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { EmailWorker } from '../../workers/email.worker.js';
import { EmailTemplatesService } from '../../services/email-templates/email-templates.service.js';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service.js';
import { OrgSettingsService } from '../org-settings/org-settings.service.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import type { EndUserJwtPayload } from '../../common/types/index.js';
import type { EndUserAuthResponseDto } from './dto/auth-response.dto.js';
import type { EndUserRegisterDto } from './dto/register.dto.js';
import type { EndUserLoginDto } from './dto/login.dto.js';
import type { EndUserSendOtpDto, EndUserVerifyOtpDto } from './dto/otp.dto.js';
import type { EndUserUpdateProfileDto } from './dto/update-profile.dto.js';
import type { EndUserRequestResetDto, EndUserResetPasswordDto } from './dto/reset-password.dto.js';
import type { StartSignupDto } from './dto/start-signup.dto.js';
import type { VerifySignupOtpDto } from './dto/verify-signup-otp.dto.js';
import type { CompleteSignupDto } from './dto/complete-signup.dto.js';

const BCRYPT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const PASSWORD_RESET_EXPIRY_MS = 15 * 60 * 1000;

@Injectable()
export class EndUserAuthService {
  private readonly logger = new Logger(EndUserAuthService.name);
  private readonly jwtPrivateKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly orgSettings: OrgSettingsService,
    private readonly emailWorker: EmailWorker,
    private readonly emailTemplates: EmailTemplatesService,
    @Optional() private readonly loyaltyService?: LoyaltyService,
  ) {
    this.jwtPrivateKey = this.configService.getOrThrow<string>('JWT_PRIVATE_KEY');
  }

  // ─── Registration ──────────────────────────────────────────────────────────

  async register(dto: EndUserRegisterDto): Promise<EndUserAuthResponseDto> {
    const org = await this.findOrgBySlug(dto.orgSlug);

    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    // ── Validate: password minimum length ───────────────────────────────────
    const passwordMinLength = await this.orgSettings.getTyped<number>(
      org.id, 'auth', 'password_min_length', 6,
    );
    if (dto.password.length < passwordMinLength) {
      throw new BadRequestException(
        `Password must be at least ${passwordMinLength} characters`,
      );
    }

    // Check for existing user
    if (dto.email) {
      const existing = await this.prisma.endUser.findUnique({
        where: { orgId_email: { orgId: org.id, email: dto.email } },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    if (dto.phone) {
      const existing = await this.prisma.endUser.findUnique({
        where: { orgId_phone: { orgId: org.id, phone: dto.phone } },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException('A user with this phone already exists');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // ── OrgSettings: check if phone/email verification is required ────────
    const [requirePhoneVerification, requireEmailVerification] = await Promise.all([
      this.orgSettings.getTyped<boolean>(org.id, 'auth', 'require_phone_verification', true),
      this.orgSettings.getTyped<boolean>(org.id, 'auth', 'require_email_verification', false),
    ]);

    // Determine onboarding step based on phone verification
    const isPhoneVerified = dto.phone
      ? !requirePhoneVerification || !!(await this.prisma.endUserOtpVerification.findFirst({
          where: {
            orgId: org.id,
            identifier: dto.phone,
            verifiedAt: { not: null },
          },
        }))
      : false;

    const isEmailVerified = dto.email
      ? !requireEmailVerification
      : false;

    const endUser = await this.prisma.endUser.create({
      data: {
        orgId: org.id,
        name: dto.name ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        passwordHash,
        status: 'active',
        isPhoneVerified,
        isEmailVerified,
        onboardingStep: isPhoneVerified ? 4 : 3,
      },
      select: { id: true, name: true, email: true, phone: true, isPhoneVerified: true, isEmailVerified: true, onboardingStep: true, avatarUrl: true, referralCode: true },
    });

    // Award welcome bonus
    try {
      const loyaltyEnabled = await this.orgSettings.getTyped<boolean>(org.id, 'loyalty', 'enabled', false);
      const welcomeBonus = await this.orgSettings.getTyped<number>(org.id, 'loyalty', 'welcome_bonus', 0);
      if (loyaltyEnabled && welcomeBonus > 0) {
        await this.loyaltyService?.earnPoints(org.id, endUser.id, welcomeBonus, 'Welcome bonus');
      }
    } catch (e) {
      // Don't fail registration if bonus fails
    }

    // Process referral code if provided
    if (dto.referralCode) {
      const referrer = await this.prisma.endUser.findFirst({
        where: { orgId: org.id, referralCode: dto.referralCode },
        select: { id: true },
      });
      if (referrer) {
        await this.prisma.referral.create({
          data: {
            orgId: org.id,
            referrerId: referrer.id,
            refereeId: endUser.id,
            code: dto.referralCode,
            status: 'pending',
          },
        }).catch((e) => {
          // Ignore duplicate referral (user already referred)
          this.logger.warn(`Failed to create referral: ${e.message}`);
        });
      }
    }

    const tokens = await this.generateTokenPair(endUser.id, org.id);

    return {
      ...tokens,
      user: await this.buildUserResponse(endUser, org.id),
    };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  async login(
    dto: EndUserLoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<EndUserAuthResponseDto> {
    const org = await this.findOrgBySlug(dto.orgSlug);

    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    // ── OrgSettings: primary_login_id determines default login flow ─────
    const primaryLoginId = await this.orgSettings.getTyped<string>(
      org.id, 'auth', 'primary_login_id', 'phone',
    );

    let endUser;
    if (dto.email) {
      endUser = await this.prisma.endUser.findUnique({
        where: { orgId_email: { orgId: org.id, email: dto.email } },
        select: { id: true, orgId: true, name: true, email: true, phone: true, passwordHash: true, isPhoneVerified: true, isEmailVerified: true, onboardingStep: true, avatarUrl: true, referralCode: true, status: true },
      });
    } else if (dto.phone) {
      endUser = await this.prisma.endUser.findUnique({
        where: { orgId_phone: { orgId: org.id, phone: dto.phone } },
        select: { id: true, orgId: true, name: true, email: true, phone: true, passwordHash: true, isPhoneVerified: true, isEmailVerified: true, onboardingStep: true, avatarUrl: true, referralCode: true, status: true },
      });
    }

    if (!endUser || !endUser.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (endUser.status === 'blocked') {
      throw new UnauthorizedException('Your account has been blocked');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, endUser.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.endUser.update({
      where: { id: endUser.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip ?? null,
      },
    });

    const tokens = await this.generateTokenPair(endUser.id, org.id, ip, userAgent);

    // Check birthday bonus on login
    try {
      await this.loyaltyService?.checkAndAwardBirthdayBonus(org.id, endUser.id);
    } catch {}

    return {
      ...tokens,
      user: await this.buildUserResponse(endUser, org.id),
      primaryLoginId,
    };
  }

  // ─── Logout ────────────────────────────────────────────────────────────────

  async logout(endUserId: string, orgId: string, refreshToken: string): Promise<void> {
    const tokenHash = this.sha256(refreshToken);

    const storedToken = await this.prisma.endUserRefreshToken.findFirst({
      where: {
        tokenHash,
        endUserId,
        orgId,
        revokedAt: null,
      },
    });

    if (storedToken) {
      await this.prisma.endUserRefreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  // ─── Refresh Tokens ────────────────────────────────────────────────────────

  async refreshTokens(
    refreshToken: string,
    ip?: string,
    userAgent?: string,
  ): Promise<EndUserAuthResponseDto> {
    const tokenHash = this.sha256(refreshToken);

    const storedToken = await this.prisma.endUserRefreshToken.findFirst({
      where: { tokenHash },
      include: { endUser: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Token reuse detection
    if (storedToken.revokedAt) {
      this.logger.warn(
        `EndUser refresh token reuse detected for family ${storedToken.family}. ` +
          `Revoking entire family. EndUser: ${storedToken.endUserId}`,
      );

      await this.prisma.endUserRefreshToken.updateMany({
        where: {
          family: storedToken.family,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      throw new UnauthorizedException('Refresh token has been revoked. Please log in again.');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const { endUser } = storedToken;
    if (!endUser || endUser.deletedAt || endUser.status === 'blocked') {
      throw new UnauthorizedException('User account is no longer active');
    }

    // Revoke old token
    await this.prisma.endUserRefreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Issue new pair with same family
    const tokens = await this.generateTokenPair(
      endUser.id,
      storedToken.orgId,
      ip,
      userAgent,
      storedToken.family,
    );

    return {
      ...tokens,
      user: await this.buildUserResponse(endUser, storedToken.orgId),
    };
  }

  // ─── OTP ───────────────────────────────────────────────────────────────────

  async sendOtp(dto: EndUserSendOtpDto): Promise<{ message: string }> {
    const org = await this.findOrgBySlug(dto.orgSlug);

    const otpConfig = await this.getOtpConfig(org.id);
    const otp = this.generateOtpCode(otpConfig.length);
    const otpHash = this.sha256(otp);

    await this.prisma.endUserOtpVerification.create({
      data: {
        orgId: org.id,
        identifier: dto.identifier,
        type: dto.type,
        otpHash,
        attempts: 0,
        maxAttempts: OTP_MAX_ATTEMPTS,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });

    const isEmail = dto.identifier.includes('@');

    if (!isEmail) {
      // Try to deliver via MSG91 for phone-based OTP
      await this.sendOtpViaMSG91(dto.identifier, otp);
    } else {
      // Email-based OTP via email worker
      const branding = await this.emailTemplates.getOrgBranding(org.id);
      const { subject, html } = this.emailTemplates.otpEmail(branding, otp);

      void this.emailWorker.processJob({
        orgId: org.id,
        type: 'generic',
        to: dto.identifier,
        subject,
        html,
      }).catch(err => this.logger.error('Email send failed', err));
    }

    this.logger.log(`EndUser OTP queued for ${dto.identifier} in org ${org.id}`);

    // Always log in dev mode
    if (process.env['NODE_ENV'] !== 'production') {
      this.logger.log(`[DEV] OTP for ${dto.identifier}: ${otp}`);
    }

    return { message: 'OTP has been sent.' };
  }

  async verifyOtp(
    dto: EndUserVerifyOtpDto,
    ip?: string,
    userAgent?: string,
  ): Promise<EndUserAuthResponseDto> {
    const org = await this.findOrgBySlug(dto.orgSlug);

    const otpRecord = await this.prisma.endUserOtpVerification.findFirst({
      where: {
        orgId: org.id,
        identifier: dto.identifier,
        type: dto.type,
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('No OTP found. Please request a new one.');
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP has expired. Please request a new one.');
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      throw new UnauthorizedException('Maximum OTP attempts exceeded. Please request a new one.');
    }

    await this.prisma.endUserOtpVerification.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    const otpHash = this.sha256(dto.otp);
    if (otpHash !== otpRecord.otpHash) {
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.prisma.endUserOtpVerification.update({
      where: { id: otpRecord.id },
      data: { verifiedAt: new Date() },
    });

    // Find or create end user by identifier
    const isEmail = dto.identifier.includes('@');
    let endUser;

    if (isEmail) {
      endUser = await this.prisma.endUser.findUnique({
        where: { orgId_email: { orgId: org.id, email: dto.identifier } },
        select: { id: true, name: true, email: true, phone: true, isPhoneVerified: true, isEmailVerified: true, onboardingStep: true, avatarUrl: true, referralCode: true, status: true },
      });
    } else {
      endUser = await this.prisma.endUser.findUnique({
        where: { orgId_phone: { orgId: org.id, phone: dto.identifier } },
        select: { id: true, name: true, email: true, phone: true, isPhoneVerified: true, isEmailVerified: true, onboardingStep: true, avatarUrl: true, referralCode: true, status: true },
      });
    }

    if (!endUser) {
      // Auto-create user on first OTP verification
      endUser = await this.prisma.endUser.create({
        data: {
          orgId: org.id,
          ...(isEmail
            ? { email: dto.identifier, isEmailVerified: true }
            : { phone: dto.identifier, isPhoneVerified: true }),
          status: 'active',
        },
        select: { id: true, name: true, email: true, phone: true, isPhoneVerified: true, isEmailVerified: true, onboardingStep: true, avatarUrl: true, referralCode: true, status: true },
      });
    } else {
      // Update verification status
      if (isEmail && !endUser.isEmailVerified) {
        await this.prisma.endUser.update({
          where: { id: endUser.id },
          data: { isEmailVerified: true },
        });
      } else if (!isEmail && !endUser.isPhoneVerified) {
        await this.prisma.endUser.update({
          where: { id: endUser.id },
          data: { isPhoneVerified: true },
        });
      }
    }

    if (endUser.status === 'blocked') {
      throw new UnauthorizedException('Your account has been blocked');
    }

    const tokens = await this.generateTokenPair(
      endUser.id,
      org.id,
      ip,
      userAgent,
    );

    return {
      ...tokens,
      user: await this.buildUserResponse(endUser, org.id),
    };
  }

  // ─── Password Reset ────────────────────────────────────────────────────────

  async requestPasswordReset(dto: EndUserRequestResetDto): Promise<{ message: string }> {
    const org = await this.findOrgBySlug(dto.orgSlug);

    const isEmail = dto.identifier.includes('@');

    if (isEmail) {
      // Email-based: use token link
      const rawToken = randomBytes(64).toString('hex');
      const tokenHash = this.sha256(rawToken);

      await this.prisma.endUserOtpVerification.create({
        data: {
          orgId: org.id,
          identifier: dto.identifier,
          type: 'password_reset',
          otpHash: tokenHash,
          attempts: 0,
          maxAttempts: 1,
          expiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
        },
      });

      const branding = await this.emailTemplates.getOrgBranding(org.id);
      const resetLink = `${process.env['APP_URL'] ?? 'https://build.withdarsh.com'}/auth/reset-password?token=${rawToken}`;
      const { subject: resetSubject, html: resetHtml } = this.emailTemplates.passwordResetEmail(branding, resetLink);

      void this.emailWorker.processJob({
        orgId: org.id,
        type: 'password_reset',
        to: dto.identifier,
        subject: resetSubject,
        html: resetHtml,
      }).catch(err => this.logger.error('Email send failed', err));
      this.logger.log(`EndUser password reset email queued for ${dto.identifier} in org ${org.id}`);
    } else {
      // Phone-based: use OTP
      const otpConfig = await this.getOtpConfig(org.id);
    const otp = this.generateOtpCode(otpConfig.length);
      const otpHash = this.sha256(otp);

      await this.prisma.endUserOtpVerification.create({
        data: {
          orgId: org.id,
          identifier: dto.identifier,
          type: 'password_reset',
          otpHash,
          attempts: 0,
          maxAttempts: OTP_MAX_ATTEMPTS,
          expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
        },
      });

      // Send OTP via MSG91
      await this.sendOtpViaMSG91(dto.identifier, otp);
      this.logger.log(`EndUser password reset OTP sent for ${dto.identifier} in org ${org.id}`);

      // Always log in dev mode
      if (process.env['NODE_ENV'] !== 'production') {
        this.logger.log(`[DEV] Password reset OTP for ${dto.identifier}: ${otp}`);
      }
    }

    return { message: 'If that account exists, a password reset has been sent.' };
  }

  async resetPassword(dto: EndUserResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.sha256(dto.token);

    const resetRecord = await this.prisma.endUserOtpVerification.findFirst({
      where: {
        otpHash: tokenHash,
        type: 'password_reset',
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetRecord) {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }

    if (resetRecord.attempts >= resetRecord.maxAttempts) {
      throw new UnauthorizedException('This password reset link has already been used');
    }

    // Find user by identifier (email or phone)
    const isEmail = resetRecord.identifier.includes('@');
    let endUser;

    if (isEmail) {
      endUser = await this.prisma.endUser.findUnique({
        where: { orgId_email: { orgId: resetRecord.orgId, email: resetRecord.identifier } },
        select: { id: true },
      });
    } else {
      endUser = await this.prisma.endUser.findUnique({
        where: { orgId_phone: { orgId: resetRecord.orgId, phone: resetRecord.identifier } },
        select: { id: true },
      });
    }

    if (!endUser) {
      throw new UnauthorizedException('User not found');
    }

    // ── OrgSettings: password minimum length ────────────────────────────
    const passwordMinLength = await this.orgSettings.getTyped<number>(
      resetRecord.orgId, 'auth', 'password_min_length', 6,
    );
    if (dto.newPassword.length < passwordMinLength) {
      throw new BadRequestException(
        `Password must be at least ${passwordMinLength} characters`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.endUser.update({
        where: { id: endUser.id },
        data: { passwordHash },
      }),
      this.prisma.endUserOtpVerification.update({
        where: { id: resetRecord.id },
        data: {
          verifiedAt: new Date(),
          attempts: { increment: 1 },
        },
      }),
      this.prisma.endUserRefreshToken.updateMany({
        where: {
          endUserId: endUser.id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password has been reset successfully.' };
  }

  // ─── Profile ───────────────────────────────────────────────────────────────

  async getProfile(endUserId: string, orgId: string) {
    const endUser = await this.prisma.endUser.findFirst({
      where: { id: endUserId, orgId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        referralCode: true,
        onboardingStep: true,
        createdAt: true,
      },
    });

    if (!endUser) {
      throw new NotFoundException('User not found');
    }

    // Include active subscription info
    const activeSubscription = await this.prisma.appSubscription.findFirst({
      where: { userId: endUserId, orgId, status: 'active' },
      select: { id: true, plan: true, status: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null);

    return {
      ...endUser,
      subscription: activeSubscription,
    };
  }

  async updateProfile(endUserId: string, orgId: string, dto: EndUserUpdateProfileDto) {
    const endUser = await this.prisma.endUser.findFirst({
      where: { id: endUserId, orgId },
      select: { id: true, attributes: true },
    });

    if (!endUser) {
      throw new NotFoundException('User not found');
    }

    // Merge preferences into existing attributes JSON
    const data: Record<string, unknown> = {};
    if (dto['name'] !== undefined) data['name'] = dto['name'];
    if (dto['email'] !== undefined) data['email'] = dto['email'];
    if (dto['phone'] !== undefined) data['phone'] = dto['phone'];

    if (dto['preferences'] !== undefined) {
      const existing = (endUser['attributes'] as Record<string, unknown>) ?? {};
      const existingPrefs = (existing['preferences'] as Record<string, unknown>) ?? {};
      data['attributes'] = {
        ...existing,
        preferences: { ...existingPrefs, ...dto['preferences'] },
      };
    }

    const updated = await this.prisma.endUser.update({
      where: { id: endUserId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        attributes: true,
        isPhoneVerified: true,
        isEmailVerified: true,
        referralCode: true,
      },
    });

    return updated;
  }

  // ─── Change Password ───────────────────────────────────────────────────────

  async changePassword(endUserId: string, orgId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const endUser = await this.prisma.endUser.findFirst({
      where: { id: endUserId, orgId },
      select: { id: true, passwordHash: true },
    });

    if (!endUser) {
      throw new NotFoundException('User not found');
    }

    if (!endUser.passwordHash) {
      throw new BadRequestException('No password set on this account');
    }

    // ── OrgSettings: password minimum length ────────────────────────────
    const passwordMinLength = await this.orgSettings.getTyped<number>(
      orgId, 'auth', 'password_min_length', 6,
    );
    if (newPassword.length < passwordMinLength) {
      throw new BadRequestException(
        `Password must be at least ${passwordMinLength} characters`,
      );
    }

    const isValid = await bcrypt.compare(currentPassword, endUser.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.endUser.update({
        where: { id: endUserId },
        data: { passwordHash: newHash },
      }),
      // Revoke all existing refresh tokens (force re-login)
      this.prisma.endUserRefreshToken.updateMany({
        where: { endUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password has been changed successfully.' };
  }

  // ─── Step-tracked Signup Flow ─────────────────────────────────────────────

  /**
   * Step 1: Accept phone, create/find EndUser, send OTP.
   */
  async startSignup(dto: StartSignupDto): Promise<{ userId: string; step: number; message: string }> {
    const org = await this.findOrgBySlug(dto.orgSlug);

    // Find or create EndUser with this phone
    let endUser = await this.prisma.endUser.findUnique({
      where: { orgId_phone: { orgId: org.id, phone: dto.phone } },
      select: { id: true, onboardingStep: true },
    });

    if (endUser && endUser.onboardingStep >= 4) {
      throw new ConflictException('A user with this phone already exists. Please log in instead.');
    }

    if (!endUser) {
      endUser = await this.prisma.endUser.create({
        data: {
          orgId: org.id,
          phone: dto.phone,
          status: 'active',
          onboardingStep: 1,
        },
        select: { id: true, onboardingStep: true },
      });
    } else {
      // Update step if not already past step 1
      await this.prisma.endUser.update({
        where: { id: endUser.id },
        data: { onboardingStep: 1 },
      });
    }

    // Send OTP to phone
    const otpConfig = await this.getOtpConfig(org.id);
    const otp = this.generateOtpCode(otpConfig.length);
    const otpHash = this.sha256(otp);

    await this.prisma.endUserOtpVerification.create({
      data: {
        orgId: org.id,
        identifier: dto.phone,
        type: 'signup',
        otpHash,
        attempts: 0,
        maxAttempts: OTP_MAX_ATTEMPTS,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });

    await this.sendOtpViaMSG91(dto.phone, otp);

    if (process.env['NODE_ENV'] !== 'production') {
      this.logger.log(`[DEV] Signup OTP for ${dto.phone}: ${otp}`);
    }

    return { userId: endUser.id, step: 1, message: 'OTP sent' };
  }

  /**
   * Step 2: Verify OTP, mark phone verified, issue temp tokens.
   */
  async verifySignupOtp(
    dto: VerifySignupOtpDto,
    ip?: string,
    userAgent?: string,
  ): Promise<{ userId: string; step: number; accessToken: string; refreshToken: string }> {
    const org = await this.findOrgBySlug(dto.orgSlug);

    // Find user
    const endUser = await this.prisma.endUser.findUnique({
      where: { orgId_phone: { orgId: org.id, phone: dto.phone } },
      select: { id: true },
    });

    if (!endUser) {
      throw new NotFoundException('No signup found for this phone. Please start signup first.');
    }

    // Verify OTP
    const otpRecord = await this.prisma.endUserOtpVerification.findFirst({
      where: {
        orgId: org.id,
        identifier: dto.phone,
        type: 'signup',
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('No OTP found. Please request a new one.');
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP has expired. Please request a new one.');
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      throw new UnauthorizedException('Maximum OTP attempts exceeded. Please request a new one.');
    }

    await this.prisma.endUserOtpVerification.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    const otpHash = this.sha256(dto.otp);
    if (otpHash !== otpRecord.otpHash) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Mark OTP as verified and update user
    await this.prisma.$transaction([
      this.prisma.endUserOtpVerification.update({
        where: { id: otpRecord.id },
        data: { verifiedAt: new Date() },
      }),
      this.prisma.endUser.update({
        where: { id: endUser.id },
        data: {
          isPhoneVerified: true,
          onboardingStep: 2,
        },
      }),
    ]);

    // Issue temporary tokens so step 3 can be authenticated
    const tokens = await this.generateTokenPair(endUser.id, org.id, ip, userAgent);

    return {
      userId: endUser.id,
      step: 2,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Step 3: Complete signup with name, email, password. Requires auth.
   */
  async completeSignup(
    endUserId: string,
    orgId: string,
    dto: CompleteSignupDto,
    ip?: string,
    userAgent?: string,
  ): Promise<EndUserAuthResponseDto> {
    const endUser = await this.prisma.endUser.findFirst({
      where: { id: endUserId, orgId },
      select: { id: true },
    });

    if (!endUser) {
      throw new NotFoundException('User not found');
    }

    // ── OrgSettings: password minimum length ────────────────────────────
    const passwordMinLength = await this.orgSettings.getTyped<number>(
      orgId, 'auth', 'password_min_length', 6,
    );
    if (dto.password.length < passwordMinLength) {
      throw new BadRequestException(
        `Password must be at least ${passwordMinLength} characters`,
      );
    }

    // Check for email conflict if email provided
    if (dto.email) {
      const existing = await this.prisma.endUser.findUnique({
        where: { orgId_email: { orgId, email: dto.email } },
        select: { id: true },
      });
      if (existing && existing.id !== endUserId) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const updated = await this.prisma.endUser.update({
      where: { id: endUserId },
      data: {
        name: dto.name,
        ...(dto.email && { email: dto.email }),
        passwordHash,
        onboardingStep: 4,
      },
      select: { id: true, name: true, email: true, phone: true, isPhoneVerified: true, isEmailVerified: true, onboardingStep: true, avatarUrl: true, referralCode: true },
    });

    // Award welcome bonus on signup completion
    try {
      const loyaltyEnabled = await this.orgSettings.getTyped<boolean>(orgId, 'loyalty', 'enabled', false);
      const welcomeBonus = await this.orgSettings.getTyped<number>(orgId, 'loyalty', 'welcome_bonus', 0);
      if (loyaltyEnabled && welcomeBonus > 0) {
        await this.loyaltyService?.earnPoints(orgId, updated.id, welcomeBonus, 'Welcome bonus');
      }
    } catch (e) {
      // Don't fail registration if bonus fails
    }

    const tokens = await this.generateTokenPair(updated.id, orgId, ip, userAgent);

    return {
      ...tokens,
      user: await this.buildUserResponse(updated, orgId),
    };
  }

  // ─── Social Login ──────────────────────────────────────────────────────────

  async socialLogin(orgId: string, provider: 'google' | 'facebook', profile: {
    email?: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
    googleId?: string;
    facebookId?: string;
  }): Promise<EndUserAuthResponseDto> {
    // Check if social login is allowed
    const allowSocial = await this.orgSettings.getTyped<boolean>(orgId, 'auth', 'allow_social_login', false);
    if (!allowSocial) {
      throw new BadRequestException('Social login is not enabled');
    }

    if (provider === 'google') {
      const googleEnabled = await this.orgSettings.getTyped<boolean>(orgId, 'auth', 'google_login_enabled', false);
      if (!googleEnabled) {
        throw new BadRequestException('Google login is not enabled');
      }
    }

    if (provider === 'facebook') {
      const facebookEnabled = await this.orgSettings.getTyped<boolean>(orgId, 'auth', 'facebook_login_enabled', false);
      if (!facebookEnabled) {
        throw new BadRequestException('Facebook login is not enabled');
      }
    }

    if (!profile.email) {
      throw new BadRequestException('Email is required for social login');
    }

    // Find or create user
    const _socialSelect = { id: true, name: true, email: true, phone: true, isPhoneVerified: true, isEmailVerified: true, onboardingStep: true, avatarUrl: true, referralCode: true, status: true } as const;

    let user = await this.prisma.endUser.findFirst({
      where: { orgId, email: profile.email },
      select: _socialSelect,
    });

    if (!user) {
      user = await this.prisma.endUser.create({
        data: {
          orgId,
          email: profile.email,
          name: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || null,
          avatarUrl: profile.picture ?? null,
          isEmailVerified: true, // Social login verifies email
          status: 'active',
          onboardingStep: 4,
        },
        select: _socialSelect,
      });
    } else {
      // Update avatar if not set
      const updateData: any = {};
      if (profile.picture && !user.avatarUrl) updateData.avatarUrl = profile.picture;
      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.endUser.update({
          where: { id: user.id },
          data: updateData,
          select: _socialSelect,
        });
      }
    }

    if (user.status === 'blocked') {
      throw new UnauthorizedException('Your account has been blocked');
    }

    await this.prisma.endUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokenPair(user.id, orgId);

    return {
      ...tokens,
      user: await this.buildUserResponse(user, orgId),
    };
  }

  // ─── Demo Login ──────────────────────────────────────────────────────────

  async demoLogin(
    orgSlug: string,
    ip?: string,
    userAgent?: string,
  ): Promise<EndUserAuthResponseDto> {
    const org = await this.findOrgBySlug(orgSlug);

    const demoEnabled = await this.orgSettings.getTyped<boolean>(
      org.id, 'auth', 'demo_enabled', false,
    );
    if (!demoEnabled) {
      throw new BadRequestException('Demo login is not enabled for this organization');
    }

    const demoEmail = await this.orgSettings.getTyped<string>(
      org.id, 'auth', 'demo_email', '',
    );
    if (!demoEmail) {
      throw new BadRequestException('Demo account is not configured');
    }

    const endUser = await this.prisma.endUser.findUnique({
      where: { orgId_email: { orgId: org.id, email: demoEmail } },
      select: {
        id: true, name: true, email: true, phone: true,
        passwordHash: true, isPhoneVerified: true, isEmailVerified: true,
        onboardingStep: true, avatarUrl: true, referralCode: true, status: true,
      },
    });

    if (!endUser) {
      throw new NotFoundException('Demo account not found');
    }

    if (endUser.status === 'blocked') {
      throw new UnauthorizedException('Demo account has been blocked');
    }

    await this.prisma.endUser.update({
      where: { id: endUser.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip ?? null },
    });

    const tokens = await this.generateTokenPair(endUser.id, org.id, ip, userAgent);

    return {
      ...tokens,
      user: await this.buildUserResponse(endUser, org.id),
    };
  }

  // ─── Public Helpers (used by other modules) ────────────────────────────────

  /**
   * Check if the user has a verified phone, required when
   * `auth.force_phone_for_orders` is true. Called by commerce-orders at create time.
   */
  async ensurePhoneVerifiedForOrders(orgId: string, endUserId: string): Promise<void> {
    const forcePhone = await this.orgSettings.getTyped<boolean>(
      orgId, 'auth', 'force_phone_for_orders', false,
    );
    if (!forcePhone) return;

    const endUser = await this.prisma.endUser.findFirst({
      where: { id: endUserId, orgId },
      select: { isPhoneVerified: true, phone: true },
    });

    if (!endUser || !endUser.phone || !endUser.isPhoneVerified) {
      throw new BadRequestException(
        'A verified phone number is required to place orders. Please verify your phone first.',
      );
    }
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private async generateTokenPair(
    endUserId: string,
    orgId: string,
    ip?: string,
    userAgent?: string,
    family?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenFamily = family ?? randomUUID();

    const accessPayload: EndUserJwtPayload = {
      sub: endUserId,
      orgId,
      type: 'enduser_access',
    };

    const refreshPayload: EndUserJwtPayload = {
      sub: endUserId,
      orgId,
      type: 'enduser_refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        privateKey: this.jwtPrivateKey,
        algorithm: 'RS256',
        expiresIn: ACCESS_TOKEN_EXPIRY,
        issuer: 'techzunction',
      }),
      this.jwtService.signAsync(refreshPayload, {
        privateKey: this.jwtPrivateKey,
        algorithm: 'RS256',
        expiresIn: REFRESH_TOKEN_EXPIRY,
        issuer: 'techzunction',
      }),
    ]);

    const tokenHash = this.sha256(refreshToken);

    await this.prisma.endUserRefreshToken.create({
      data: {
        orgId,
        endUserId,
        tokenHash,
        family: tokenFamily,
        ipAddress: ip ?? null,
        userAgent: userAgent ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    return { accessToken, refreshToken };
  }

  private async sendOtpViaMSG91(phone: string, otp: string): Promise<void> {
    try {
      const msg91Key = this.configService.get<string>('msg91.authKey');
      if (msg91Key) {
        const mobile = phone.replace(/^\+?91/, '');
        const response = await fetch('https://control.msg91.com/api/v5/otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', authkey: msg91Key },
          body: JSON.stringify({
            mobile: `91${mobile}`,
            otp,
            otp_length: 6,
            otp_expiry: 5,
          }),
        });
        this.logger.log(`OTP sent via MSG91 to ${mobile} (status: ${response.status})`);
      }
    } catch (e) {
      this.logger.warn(`MSG91 OTP delivery failed: ${e}`);
    }
  }

  private async findOrgBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    if (org.status === 'suspended') {
      throw new UnauthorizedException('Organization is suspended');
    }

    return org;
  }


  private async buildUserResponse(endUser: {
    id: string; name: string | null; email: string | null; phone: string | null;
    isPhoneVerified: boolean; isEmailVerified: boolean;
    onboardingStep: number; avatarUrl?: string | null; referralCode?: string | null;
  }, orgId: string) {
    // Fetch active subscription (if any)
    const subscription = await this.prisma.appSubscription.findFirst({
      where: { userId: endUser.id, orgId, status: 'active' },
      select: { id: true, plan: true, status: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null);

    return {
      id: endUser.id,
      name: endUser.name,
      email: endUser.email,
      phone: endUser.phone,
      orgId,
      isPhoneVerified: endUser.isPhoneVerified,
      isEmailVerified: endUser.isEmailVerified,
      onboardingStep: endUser.onboardingStep,
      avatarUrl: endUser.avatarUrl ?? null,
      referralCode: endUser.referralCode ?? null,
      subscription,
    };
  }

  private sha256(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }


  private async getOtpConfig(orgId: string): Promise<{ length: number; expiryMs: number }> {
    const settings = await this.prisma.orgSettings.findMany({
      where: { orgId, group: 'auth', key: { in: ['otp_length', 'otp_expiry_minutes'] } },
    });
    const lengthSetting = settings.find(s => s.key === 'otp_length');
    const expirySetting = settings.find(s => s.key === 'otp_expiry_minutes');
    return {
      length: lengthSetting ? Number(lengthSetting.value) : 6,
      expiryMs: expirySetting ? Number(expirySetting.value) * 60 * 1000 : OTP_EXPIRY_MS,
    };
  }

  private generateOtpCode(length = 6): string {
    const max = Math.pow(10, length);
    const buffer = randomBytes(4);
    const num = buffer.readUInt32BE(0) % max;
    return num.toString().padStart(length, '0');
  }
}
