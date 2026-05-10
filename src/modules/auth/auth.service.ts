import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { EmailWorker } from '../../workers/email.worker.js';
import { EmailTemplatesService } from '../../services/email-templates/email-templates.service.js';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service.js';
import type { JwtPayload } from '../../common/types/index.js';
import type { AuthResponseDto } from './dto/index.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RequestMagicLinkDto, VerifyMagicLinkDto } from './dto/magic-link.dto.js';
import type { SendOtpDto, VerifyOtpDto } from './dto/otp.dto.js';
import type {
  RequestPasswordResetDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto/reset-password.dto.js';
import type { OtpType } from '@prisma/client';

const BCRYPT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const MAGIC_LINK_EXPIRY_MS = 15 * 60 * 1000;
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const PASSWORD_RESET_EXPIRY_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtPrivateKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailWorker: EmailWorker,
    private readonly emailTemplates: EmailTemplatesService,
  ) {
    this.jwtPrivateKey = this.configService.getOrThrow<string>('JWT_PRIVATE_KEY');
  }

  // ─── Registration ──────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const org = await this.findOrgBySlug(dto.orgSlug);

    // Check if email already exists in this org
    const existingUser = await this.prisma.user.findUnique({
      where: { orgId_email: { orgId: org.id, email: dto.email } },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists in this organization');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        orgId: org.id,
        name: dto.name,
        email: dto.email,
        passwordHash,
        isEmailVerified: false,
        status: 'active',
      },
      select: { id: true, name: true, email: true },
    });

    // Find and assign default role (org_admin for first user, or default role)
    const defaultRole = await this.prisma.role.findFirst({
      where: {
        orgId: org.id,
        isDefault: true,
      },
    });

    const roleIds: string[] = [];

    if (defaultRole) {
      await this.prisma.userRole.create({
        data: {
          orgId: org.id,
          userId: user.id,
          roleId: defaultRole.id,
        },
      });
      roleIds.push(defaultRole.id);
    }

    // Generate token pair
    const tokens = await this.generateTokenPair(user.id, org.id, roleIds);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        orgId: org.id,
        roles: roleIds,
      },
    };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  async login(
    dto: LoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const org = await this.findOrgBySlug(dto.orgSlug);

    const user = await this.prisma.user.findUnique({
      where: { orgId_email: { orgId: org.id, email: dto.email } },
      select: {
        id: true, name: true, email: true, passwordHash: true, status: true,
        userRoles: { select: { roleId: true } },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'suspended' || user.status === 'blocked') {
      throw new UnauthorizedException('Your account has been suspended');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login info
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip ?? null,
      },
    });

    const roleIds = user.userRoles.map((ur) => ur.roleId);
    const tokens = await this.generateTokenPair(
      user.id,
      org.id,
      roleIds,
      ip,
      userAgent,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        orgId: org.id,
        roles: roleIds,
      },
    };
  }

  // ─── Logout ────────────────────────────────────────────────────────────────

  async logout(
    userId: string,
    orgId: string,
    refreshToken: string,
  ): Promise<void> {
    const tokenHash = this.sha256(refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        userId,
        orgId,
        revokedAt: null,
      },
    });

    if (storedToken) {
      await this.prisma.refreshToken.update({
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
  ): Promise<AuthResponseDto> {
    const tokenHash = this.sha256(refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: {
        user: {
          include: {
            userRoles: { select: { roleId: true } },
          },
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token was already revoked (potential token reuse attack)
    if (storedToken.revokedAt) {
      // Revoke entire token family — compromise detected
      this.logger.warn(
        `Refresh token reuse detected for family ${storedToken.family}. ` +
          `Revoking entire family. User: ${storedToken.userId}`,
      );

      await this.prisma.refreshToken.updateMany({
        where: {
          family: storedToken.family,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      throw new UnauthorizedException(
        'Refresh token has been revoked. Please log in again.',
      );
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Check user status
    const { user } = storedToken;
    if (!user || user.deletedAt || user.status === 'suspended' || user.status === 'blocked') {
      throw new UnauthorizedException('User account is no longer active');
    }

    // Revoke the old refresh token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Issue new token pair with the same family
    const roleIds = user.userRoles.map((ur) => ur.roleId);
    const tokens = await this.generateTokenPair(
      user.id,
      storedToken.orgId,
      roleIds,
      ip,
      userAgent,
      storedToken.family,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        orgId: storedToken.orgId,
        roles: roleIds,
      },
    };
  }

  // ─── Magic Link ────────────────────────────────────────────────────────────

  async requestMagicLink(dto: RequestMagicLinkDto): Promise<{ message: string }> {
    const org = await this.findOrgBySlug(dto.orgSlug);

    const user = await this.prisma.user.findUnique({
      where: { orgId_email: { orgId: org.id, email: dto.email } },
      select: { id: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If that email exists, a magic link has been sent.' };
    }

    // Generate a 64-byte random token
    const rawToken = randomBytes(64).toString('hex');
    const tokenHash = this.sha256(rawToken);

    await this.prisma.magicLink.create({
      data: {
        orgId: org.id,
        email: dto.email,
        tokenHash,
        expiresAt: new Date(Date.now() + MAGIC_LINK_EXPIRY_MS),
      },
    });

    const branding = await this.emailTemplates.getOrgBranding(org.id);
    const magicLink = `${process.env['APP_URL'] ?? 'https://build.withdarsh.com'}/auth/magic-link?token=${rawToken}&org=${org.id}`;
    const { subject, html } = this.emailTemplates.magicLinkEmail(branding, magicLink);

    void this.emailWorker.processJob({
      orgId: org.id,
      type: 'magic_link',
      to: dto.email,
      subject,
      html,
    }).catch(err => this.logger.error('Email send failed', err));
    this.logger.log(`Magic link created for ${dto.email} in org ${org.id}`);

    return { message: 'If that email exists, a magic link has been sent.' };
  }

  async verifyMagicLink(
    dto: VerifyMagicLinkDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const org = await this.findOrgBySlug(dto.orgSlug);
    const tokenHash = this.sha256(dto.token);

    const magicLink = await this.prisma.magicLink.findFirst({
      where: {
        orgId: org.id,
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!magicLink) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    // Mark as used
    await this.prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date(), ipAddress: ip ?? null },
    });

    // Find user and generate tokens
    const user = await this.prisma.user.findUnique({
      where: { orgId_email: { orgId: org.id, email: magicLink.email } },
      include: { userRoles: { select: { roleId: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status === 'suspended' || user.status === 'blocked') {
      throw new UnauthorizedException('Your account has been suspended');
    }

    // Mark email as verified
    if (!user.isEmailVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });
    }

    const roleIds = user.userRoles.map((ur) => ur.roleId);
    const tokens = await this.generateTokenPair(
      user.id,
      org.id,
      roleIds,
      ip,
      userAgent,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        orgId: org.id,
        roles: roleIds,
      },
    };
  }

  // ─── OTP ───────────────────────────────────────────────────────────────────

  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    const org = await this.findOrgBySlug(dto.orgSlug);

    // Generate 6-digit OTP
    const otp = this.generateOtpCode();
    const otpHash = this.sha256(otp);

    await this.prisma.otpVerification.create({
      data: {
        orgId: org.id,
        identifier: dto.identifier,
        type: dto.type as OtpType,
        otpHash,
        attempts: 0,
        maxAttempts: OTP_MAX_ATTEMPTS,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });

    const branding = await this.emailTemplates.getOrgBranding(org.id);
    const { subject: otpSubject, html: otpHtml } = this.emailTemplates.otpEmail(branding, otp);

    void this.emailWorker.processJob({
      orgId: org.id,
      type: 'generic',
      to: dto.identifier,
      subject: otpSubject,
      html: otpHtml,
    }).catch(err => this.logger.error('Email send failed', err));
    this.logger.log(
      `OTP created for ${dto.identifier} (type: ${dto.type}) in org ${org.id}`,
    );

    return { message: 'OTP has been sent.' };
  }

  async verifyOtp(
    dto: VerifyOtpDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const org = await this.findOrgBySlug(dto.orgSlug);

    // Find latest OTP for this identifier + type + org
    const otpRecord = await this.prisma.otpVerification.findFirst({
      where: {
        orgId: org.id,
        identifier: dto.identifier,
        type: dto.type as OtpType,
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('No OTP found. Please request a new one.');
    }

    // Check if expired
    if (otpRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP has expired. Please request a new one.');
    }

    // Check max attempts
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      throw new UnauthorizedException(
        'Maximum OTP attempts exceeded. Please request a new one.',
      );
    }

    // Increment attempts
    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    // Verify OTP hash
    const otpHash = this.sha256(dto.otp);
    if (otpHash !== otpRecord.otpHash) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Mark as verified
    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verifiedAt: new Date() },
    });

    // Find user by identifier (email)
    const user = await this.prisma.user.findUnique({
      where: { orgId_email: { orgId: org.id, email: dto.identifier } },
      include: { userRoles: { select: { roleId: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status === 'suspended' || user.status === 'blocked') {
      throw new UnauthorizedException('Your account has been suspended');
    }

    const roleIds = user.userRoles.map((ur) => ur.roleId);
    const tokens = await this.generateTokenPair(
      user.id,
      org.id,
      roleIds,
      ip,
      userAgent,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        orgId: org.id,
        roles: roleIds,
      },
    };
  }

  // ─── Password Reset ────────────────────────────────────────────────────────

  async requestPasswordReset(
    dto: RequestPasswordResetDto,
  ): Promise<{ message: string }> {
    const org = await this.findOrgBySlug(dto.orgSlug);

    const user = await this.prisma.user.findUnique({
      where: { orgId_email: { orgId: org.id, email: dto.email } },
      select: { id: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If that email exists, a password reset link has been sent.' };
    }

    // Generate reset token and store as a magic link with a specific purpose
    const rawToken = randomBytes(64).toString('hex');
    const tokenHash = this.sha256(rawToken);

    // Use OtpVerification for password reset tracking
    await this.prisma.otpVerification.create({
      data: {
        orgId: org.id,
        identifier: dto.email,
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
      to: dto.email,
      subject: resetSubject,
      html: resetHtml,
    }).catch(err => this.logger.error('Email send failed', err));
    this.logger.log(`Password reset requested for ${dto.email} in org ${org.id}`);

    return { message: 'If that email exists, a password reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.sha256(dto.token);

    // Find the password reset record
    const resetRecord = await this.prisma.otpVerification.findFirst({
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

    // Check max attempts
    if (resetRecord.attempts >= resetRecord.maxAttempts) {
      throw new UnauthorizedException(
        'This password reset link has already been used',
      );
    }

    // Find user
    const user = await this.prisma.user.findUnique({
      where: {
        orgId_email: {
          orgId: resetRecord.orgId,
          email: resetRecord.identifier,
        },
      },
      select: { id: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    // Update password and mark reset record as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.otpVerification.update({
        where: { id: resetRecord.id },
        data: {
          verifiedAt: new Date(),
          attempts: { increment: 1 },
        },
      }),
      // Revoke all existing refresh tokens for this user (security measure)
      this.prisma.refreshToken.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password has been reset successfully.' };
  }

  async changePassword(
    userId: string,
    orgId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, orgId: true },
    });

    if (!user || user.orgId !== orgId) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'No password set on this account. Use a different authentication method.',
      );
    }

    const isCurrentValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),
      // Revoke all existing refresh tokens (force re-login)
      this.prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password has been changed successfully.' };
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private async generateTokenPair(
    userId: string,
    orgId: string,
    roleIds: string[],
    ip?: string,
    userAgent?: string,
    family?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenFamily = family ?? randomUUID();

    const accessPayload: JwtPayload = {
      sub: userId,
      orgId,
      roleIds,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: userId,
      orgId,
      roleIds,
      type: 'refresh',
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

    // Store refresh token hash in DB
    const tokenHash = this.sha256(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        orgId,
        userId,
        tokenHash,
        family: tokenFamily,
        ipAddress: ip ?? null,
        userAgent: userAgent ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    return { accessToken, refreshToken };
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

  private sha256(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  private generateOtpCode(): string {
    // Generate a cryptographically secure 6-digit OTP
    const buffer = randomBytes(4);
    const num = buffer.readUInt32BE(0) % 1_000_000;
    return num.toString().padStart(6, '0');
  }
}
