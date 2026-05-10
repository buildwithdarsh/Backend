import { Injectable, Logger } from '@nestjs/common';
import { WatchSessionsService } from '../modules/watch-sessions/watch-sessions.service.js';

export interface BillingJobPayload {
  sessionId: string;
}

const MAX_RETRIES = 3;

@Injectable()
export class BillingWorker {
  private readonly logger = new Logger(BillingWorker.name);

  constructor(
    private readonly watchSessionsService: WatchSessionsService,
  ) {}

  async processJob(payload: BillingJobPayload): Promise<void> {
    const { sessionId } = payload;

    this.logger.debug(`Billing tick for session ${sessionId}`);

    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.watchSessionsService.billSession(sessionId);
        return;
      } catch (error) {
        lastError = error;
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Billing failed for session ${sessionId} (attempt ${attempt}/${MAX_RETRIES}): ${message}`,
        );

        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError;
  }
}
