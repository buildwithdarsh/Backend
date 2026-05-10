import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service.js';
import { EncryptionService } from '../../services/encryption/encryption.service.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'openid',
  'email',
];

@Injectable()
export class GmailAccountsService {
  private readonly logger = new Logger(GmailAccountsService.name);
  private readonly googleClientId: string;
  private readonly googleClientSecret: string;
  private readonly googleRedirectUri: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
  ) {
    this.googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID', '');
    this.googleClientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET', '');
    this.googleRedirectUri = this.configService.get<string>(
      'GMAIL_CALLBACK_URL',
      'http://localhost:7003/api/v1/storefront/gmail-accounts/callback',
    );
  }

  /** Generate the Google OAuth consent URL for gmail.readonly. */
  getConnectUrl(): string {
    const params = new URLSearchParams({
      client_id: this.googleClientId,
      redirect_uri: this.googleRedirectUri,
      response_type: 'code',
      scope: GMAIL_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /** List all Gmail accounts connected by this end-user (no tokens). */
  async list(orgId: string, endUserId: string) {
    return this.prisma.gmailAccount.findMany({
      where: { orgId, endUserId, isActive: true },
      select: {
        id: true,
        email: true,
        scopes: true,
        lastScanAt: true,
        connectedAt: true,
      },
      orderBy: { connectedAt: 'desc' },
    });
  }

  /**
   * Exchange auth code for tokens, fetch email, encrypt refresh token, upsert.
   */
  async connect(orgId: string, endUserId: string, code: string) {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.googleClientId,
        client_secret: this.googleClientSecret,
        redirect_uri: this.googleRedirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      this.logger.error(`Gmail token exchange failed: ${err}`);
      throw new BadRequestException('Failed to exchange authorization code');
    }

    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
    };

    if (!tokenData.refresh_token) {
      throw new BadRequestException(
        'No refresh token received. Please revoke app access in your Google account and try again.',
      );
    }

    // Fetch user email
    const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      throw new BadRequestException('Failed to fetch Gmail account info');
    }

    const userInfo = (await userInfoRes.json()) as { email: string };
    const email = userInfo.email;

    const encryptedRefreshToken = this.encryptionService.encrypt(tokenData.refresh_token);
    const scopes = tokenData.scope ? tokenData.scope.split(' ') : GMAIL_SCOPES;

    const account = await this.prisma.gmailAccount.upsert({
      where: { orgId_endUserId_email: { orgId, endUserId, email } },
      update: {
        encryptedRefreshToken,
        scopes,
        isActive: true,
        connectedAt: new Date(),
      },
      create: {
        orgId,
        endUserId,
        email,
        encryptedRefreshToken,
        scopes,
      },
      select: {
        id: true,
        email: true,
        scopes: true,
        lastScanAt: true,
        connectedAt: true,
      },
    });

    this.logger.log(`Gmail connected: ${email} for endUser ${endUserId}`);
    return account;
  }

  /** Disconnect (soft-delete) a Gmail account. */
  async disconnect(orgId: string, endUserId: string, accountId: string) {
    const account = await this.prisma.gmailAccount.findFirst({
      where: { id: accountId, orgId, endUserId },
    });

    if (!account) throw new NotFoundException('Gmail account not found');

    await this.prisma.gmailAccount.update({
      where: { id: accountId },
      data: { isActive: false },
    });

    return { message: 'Gmail account disconnected' };
  }

  /**
   * Trigger a manual scan for a connected Gmail account.
   * Updates lastScanAt — actual scanning is done asynchronously by a worker.
   */
  async triggerScan(orgId: string, endUserId: string, accountId: string) {
    const account = await this.prisma.gmailAccount.findFirst({
      where: { id: accountId, orgId, endUserId, isActive: true },
    });

    if (!account) throw new NotFoundException('Gmail account not found');

    // Throttle: prevent re-scan within 5 minutes
    if (account.lastScanAt) {
      const msSinceScan = Date.now() - account.lastScanAt.getTime();
      if (msSinceScan < 5 * 60 * 1000) {
        throw new ForbiddenException('Scan already triggered recently. Please wait a few minutes.');
      }
    }

    await this.prisma.gmailAccount.update({
      where: { id: accountId },
      data: { lastScanAt: new Date() },
    });

    // TODO: enqueue BullMQ job for actual Gmail keyword scan
    this.logger.log(`Gmail scan triggered for account ${accountId}`);

    return { message: 'Scan triggered', accountId };
  }

  /** Get decrypted refresh token — used internally by scan workers. */
  async getRefreshToken(accountId: string): Promise<string> {
    const account = await this.prisma.gmailAccount.findUnique({
      where: { id: accountId },
      select: { encryptedRefreshToken: true },
    });

    if (!account) throw new NotFoundException('Gmail account not found');
    return this.encryptionService.decrypt(account.encryptedRefreshToken);
  }
}
