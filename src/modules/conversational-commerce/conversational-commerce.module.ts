import { Module } from '@nestjs/common';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { ConversationFsmService } from './conversation-fsm.service.js';
import { WhatsappChannelHandler } from './channels/whatsapp-channel.handler.js';
import { WhatsappWebhookController } from './whatsapp-webhook.controller.js';

@Module({
  imports: [OrgSettingsModule],
  controllers: [WhatsappWebhookController],
  providers: [ConversationFsmService, WhatsappChannelHandler],
  exports: [ConversationFsmService, WhatsappChannelHandler],
})
export class ConversationalCommerceModule {}
