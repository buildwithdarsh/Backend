import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { type Request } from 'express';
import { Public } from '../../common/decorators/index.js';
import { PrismaService } from '../../database/prisma.service.js';
import { OrgSettingsService } from '../org-settings/org-settings.service.js';
import { ConversationFsmService } from './conversation-fsm.service.js';
import { WhatsappChannelHandler } from './channels/whatsapp-channel.handler.js';

@ApiExcludeController()
@Controller('api/v1/webhooks/whatsapp')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orgSettings: OrgSettingsService,
    private readonly fsmService: ConversationFsmService,
    private readonly whatsappHandler: WhatsappChannelHandler,
  ) {}

  /**
   * GET /api/v1/webhooks/whatsapp/:orgSlug
   * Meta webhook verification challenge (public).
   */
  @Public()
  @Get(':orgSlug')
  async verify(
    @Param('orgSlug') orgSlug: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const org = await this.resolveOrg(orgSlug);

    // Read the verify token from org settings
    const setting = await this.prisma.orgSettings.findFirst({
      where: { orgId: org.id, group: 'whatsapp', key: 'verify_token' },
    });

    if (mode === 'subscribe' && setting && setting.value === verifyToken) {
      this.logger.log(`WhatsApp webhook verified for org ${orgSlug}`);
      return Number(challenge);
    }

    this.logger.warn(`WhatsApp webhook verification failed for org ${orgSlug}`);
    return 'Verification failed';
  }

  /**
   * POST /api/v1/webhooks/whatsapp/:orgSlug
   * Incoming WhatsApp messages (public).
   * Returns 200 immediately; processing is async.
   */
  @Public()
  @Post(':orgSlug')
  async incoming(
    @Param('orgSlug') orgSlug: string,
    @Body() body: Record<string, unknown>,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    const org = await this.resolveOrg(orgSlug);

    // ── OrgSettings: check if WhatsApp is enabled ───────────────────────
    const whatsappEnabled = await this.orgSettings.getTyped<boolean>(
      org.id, 'features', 'whatsapp_enabled', false,
    );
    if (!whatsappEnabled) {
      this.logger.warn(`WhatsApp is disabled for org ${orgSlug}, ignoring incoming message`);
      return { status: 'disabled' };
    }

    // Verify signature if app secret is configured
    if (signature && req.rawBody) {
      const appSecretSetting = await this.prisma.orgSettings.findFirst({
        where: { orgId: org.id, group: 'whatsapp', key: 'app_secret' },
      });

      if (appSecretSetting) {
        const isValid = this.whatsappHandler.verifyWebhookSignature(
          req.rawBody.toString('utf-8'),
          signature,
          appSecretSetting.value,
        );

        if (!isValid) {
          this.logger.warn(`Invalid webhook signature for org ${orgSlug}`);
          return { status: 'invalid_signature' };
        }
      }
    }

    // Parse the incoming message
    const parsed = this.whatsappHandler.parseIncoming(body);
    if (!parsed) {
      // Not a user message (e.g., status update) — acknowledge silently
      return { status: 'ok' };
    }

    // Process asynchronously — do not block the webhook response
    this.processMessage(org.id, parsed.phone, parsed.text, parsed.messageType, parsed.externalMessageId)
      .catch((err) => {
        this.logger.error(`Error processing WhatsApp message for org ${orgSlug}`, err);
      });

    return { status: 'ok' };
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private async resolveOrg(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!org) {
      throw new NotFoundException(`Organization "${slug}" not found`);
    }

    return org;
  }

  private async processMessage(
    orgId: string,
    phone: string,
    text: string,
    messageType: string,
    externalMessageId?: string,
  ) {
    const responses = await this.fsmService.handleIncomingMessage(orgId, 'whatsapp', phone, {
      text,
      messageType,
      ...(externalMessageId ? { externalMessageId } : {}),
    });

    // Send each response back via WhatsApp
    for (const resp of responses) {
      await this.whatsappHandler.sendMessage(orgId, phone, resp.text);
    }
  }
}
