import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service.js';
import { EncryptionService } from '../../services/encryption/encryption.service.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
];

@Injectable()
export class ConnectedSourcesService {
  private readonly logger = new Logger(ConnectedSourcesService.name);
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
    this.googleRedirectUri = this.configService.get<string>('GOOGLE_DRIVE_CALLBACK_URL', 'http://localhost:7003/auth/google-drive/callback');
  }

  /**
   * List all connected sources for a user (safe — no tokens).
   */
  async getConnectedSources(orgId: string, endUserId: string) {
    const sources = await this.prisma.connectedSource.findMany({
      where: { orgId, endUserId },
      select: {
        provider: true,
        email: true,
        connectedAt: true,
      },
    });

    return sources;
  }

  /**
   * Find the google_drive connected source, or null.
   */
  async getGoogleDriveSource(orgId: string, endUserId: string) {
    return this.prisma.connectedSource.findFirst({
      where: { orgId, endUserId, provider: 'google_drive' },
      omit: { accessToken: true, refreshToken: true },
    });
  }

  /**
   * Generate the Google OAuth consent URL.
   */
  getGoogleOAuthUrl(): string {
    this.logger.log(`OAuth URL params: client_id=${this.googleClientId}, redirect_uri=${this.googleRedirectUri}`);

    const params = new URLSearchParams({
      client_id: this.googleClientId,
      redirect_uri: this.googleRedirectUri,
      response_type: 'code',
      scope: GOOGLE_DRIVE_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    this.logger.log(`Generated OAuth URL: ${url}`);
    return url;
  }

  /**
   * Exchange an authorization code for tokens, fetch user email,
   * encrypt the refresh token, and store everything in the DB.
   */
  async connectGoogleDrive(orgId: string, endUserId: string, code: string) {
    // 1. Exchange code for tokens
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
      this.logger.error(`Google token exchange failed: ${err}`);
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

    // 2. Fetch user email from Google
    const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    let email: string | null = null;
    if (userInfoRes.ok) {
      const userInfo = (await userInfoRes.json()) as { email?: string };
      email = userInfo.email ?? null;
    }

    // 3. Encrypt tokens before storage
    const encryptedAccessToken = this.encryptionService.encrypt(tokenData.access_token);
    const encryptedRefreshToken = this.encryptionService.encrypt(tokenData.refresh_token);

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    const scopes = tokenData.scope ? tokenData.scope.split(' ') : GOOGLE_DRIVE_SCOPES;

    // 4. Upsert connected source
    const source = await this.prisma.connectedSource.upsert({
      where: {
        orgId_endUserId_provider: {
          orgId,
          endUserId,
          provider: 'google_drive',
        },
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        email,
        scopes,
        expiresAt,
        connectedAt: new Date(),
      },
      create: {
        orgId,
        endUserId,
        provider: 'google_drive',
        email,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        scopes,
        expiresAt,
      },
    });

    this.logger.log(`Google Drive connected for user ${endUserId} (${email})`);

    return {
      provider: source.provider,
      email: source.email,
      connectedAt: source.connectedAt,
    };
  }

  /**
   * Disconnect a source by deleting it from the DB.
   */
  async disconnectSource(orgId: string, endUserId: string, provider: string) {
    const existing = await this.prisma.connectedSource.findFirst({
      where: { orgId, endUserId, provider },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Connected source not found');
    }

    await this.prisma.connectedSource.delete({
      where: { id: existing.id },
    });

    this.logger.log(`Disconnected ${provider} for user ${endUserId}`);

    return { message: 'Source disconnected successfully' };
  }

  /**
   * Get a valid (non-expired) access token for the user's Google Drive.
   * Refreshes automatically if expired, and updates the DB.
   */
  async getValidAccessToken(orgId: string, endUserId: string): Promise<string> {
    const source = await this.prisma.connectedSource.findFirst({
      where: { orgId, endUserId, provider: 'google_drive' },
    });

    if (!source) {
      throw new NotFoundException('Google Drive not connected');
    }

    // Check if token is still valid (with 5-minute buffer)
    const isExpired =
      !source.expiresAt || source.expiresAt.getTime() < Date.now() + 5 * 60 * 1000;

    if (!isExpired && source.accessToken) {
      return this.encryptionService.decrypt(source.accessToken);
    }

    // Refresh the token
    const decryptedRefreshToken = this.encryptionService.decrypt(source.refreshToken);

    const refreshRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.googleClientId,
        client_secret: this.googleClientSecret,
        refresh_token: decryptedRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!refreshRes.ok) {
      const err = await refreshRes.text();
      this.logger.error(`Google token refresh failed: ${err}`);
      throw new BadRequestException(
        'Failed to refresh Google Drive access. Please reconnect your Google Drive.',
      );
    }

    const refreshData = (await refreshRes.json()) as {
      access_token: string;
      expires_in: number;
    };

    const encryptedNewAccessToken = this.encryptionService.encrypt(refreshData.access_token);
    const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000);

    await this.prisma.connectedSource.update({
      where: { id: source.id },
      data: {
        accessToken: encryptedNewAccessToken,
        expiresAt: newExpiresAt,
      },
    });

    return refreshData.access_token;
  }

  /**
   * Check if a user has a specific provider connected.
   */
  async isConnected(orgId: string, endUserId: string, provider: string): Promise<boolean> {
    const count = await this.prisma.connectedSource.count({
      where: { orgId, endUserId, provider },
    });

    return count > 0;
  }
}
