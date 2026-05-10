import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri: string;
}

@Injectable()
export class GDriveService implements OnModuleInit {
  private readonly logger = new Logger(GDriveService.name);
  private serviceAccount: ServiceAccountKey | null = null;
  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    // Load service account from env (base64-encoded JSON) or fallback to file
    const saJson = this.configService.get<string>('GDRIVE_SERVICE_ACCOUNT_JSON');
    if (saJson) {
      try {
        this.serviceAccount = JSON.parse(
          Buffer.from(saJson, 'base64').toString('utf-8'),
        );
        this.logger.log('GDrive service account loaded from env');
      } catch {
        this.logger.warn('Failed to parse GDRIVE_SERVICE_ACCOUNT_JSON');
      }
    }

    if (!this.serviceAccount) {
      try {
        // Dynamic import for local dev (file won't exist in prod)
        const fs = await import('fs');
        const path = await import('path');
        const keyPath = path.join(__dirname, 'gdrive-service-account.json');
        if (fs.existsSync(keyPath)) {
          this.serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
          this.logger.log('GDrive service account loaded from file');
        }
      } catch {
        this.logger.warn('No GDrive service account found');
      }
    }
  }

  private createJwt(): string {
    if (!this.serviceAccount) throw new Error('No GDrive service account');

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: this.serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      aud: this.serviceAccount.token_uri,
      iat: now,
      exp: now + 3600,
    };

    const encode = (obj: object) =>
      Buffer.from(JSON.stringify(obj)).toString('base64url');

    const unsigned = `${encode(header)}.${encode(payload)}`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsigned);
    const signature = sign.sign(this.serviceAccount.private_key, 'base64url');

    return `${unsigned}.${signature}`;
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (5 min buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300_000) {
      return this.accessToken;
    }

    if (!this.serviceAccount) throw new Error('No GDrive service account');

    const jwt = this.createJwt();
    const res = await fetch(this.serviceAccount.token_uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`GDrive token error: ${err}`);
      throw new Error('Failed to get GDrive access token');
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;
    return this.accessToken;
  }

  /**
   * Get a temporary stream URL for a GDrive file.
   * Returns a signed redirect URL that the frontend can use directly.
   */
  async getStreamUrl(fileId: string): Promise<string> {
    const token = await this.getAccessToken();
    // Return the direct download URL with auth token as query param
    // This allows the browser's <video> tag to stream it directly
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${token}`;
  }

  /**
   * Proxy-stream a GDrive file. Supports HTTP Range requests for seeking.
   * Returns the GDrive response (headers + readable body) for piping to the client.
   */
  async proxyStream(fileId: string, rangeHeader?: string): Promise<{
    status: number;
    headers: Record<string, string>;
    body: ReadableStream<Uint8Array> | null;
  }> {
    const token = await this.getAccessToken();
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    // Forward Range header for seeking support
    if (rangeHeader) {
      headers['Range'] = rangeHeader;
    }

    const res = await fetch(url, { headers });

    // Build response headers to forward
    const responseHeaders: Record<string, string> = {};
    const forwardHeaders = [
      'content-type', 'content-length', 'content-range',
      'accept-ranges', 'content-disposition',
    ];
    for (const h of forwardHeaders) {
      const val = res.headers.get(h);
      if (val) responseHeaders[h] = val;
    }

    // Ensure accept-ranges is set so browser knows seeking is supported
    if (!responseHeaders['accept-ranges']) {
      responseHeaders['accept-ranges'] = 'bytes';
    }

    // Prevent caching of the stream URL
    responseHeaders['cache-control'] = 'no-store, no-cache, must-revalidate';
    responseHeaders['x-content-type-options'] = 'nosniff';

    return {
      status: res.status,
      headers: responseHeaders,
      body: res.body,
    };
  }

  /**
   * Verify a file exists and get its metadata
   */
  async getFileInfo(fileId: string): Promise<{ name: string; mimeType: string; size: string } | null> {
    try {
      const token = await this.getAccessToken();
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType,size`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return null;
      return res.json() as Promise<{ name: string; mimeType: string; size: string }>;
    } catch {
      return null;
    }
  }

  isConfigured(): boolean {
    return this.serviceAccount !== null;
  }
}
