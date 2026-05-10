import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Ably from 'ably';

@Injectable()
export class AblyService {
  private readonly logger = new Logger(AblyService.name);
  private rest: Ably.Rest | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ABLY_API_KEY');
    if (apiKey) {
      try {
        this.rest = new Ably.Rest({ key: apiKey });
        this.logger.log('Ably REST client initialised');
      } catch (err) {
        this.logger.warn(`Ably init failed (subscribe-only key?) — using mock tokens. Error: ${(err as Error).message}`);
        this.rest = null;
      }
    } else {
      this.logger.warn('ABLY_API_KEY not set — real-time features will return mock tokens');
    }
  }

  /**
   * Create a token scoped to a specific channel.
   * Returns mock token if Ably is not configured or key lacks publish capability.
   */
  async createToken(
    clientId: string,
    channelName: string,
  ): Promise<string> {
    if (!this.rest) {
      return `mock-ably-token:${clientId}:${channelName}`;
    }

    try {
      const tokenRequest = await this.rest.auth.createTokenRequest({
        clientId,
        capability: { [channelName]: ['subscribe', 'publish', 'presence'] },
      });

      this.logger.debug(
        `Token request created for client=${clientId} channel=${channelName}`,
      );

      return JSON.stringify(tokenRequest);
    } catch (err) {
      this.logger.warn(`Ably token creation failed, returning mock token: ${(err as Error).message}`);
      return `mock-ably-token:${clientId}:${channelName}`;
    }
  }
}
