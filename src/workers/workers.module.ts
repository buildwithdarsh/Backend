import { Module } from '@nestjs/common';
import { EncryptionModule } from '../services/encryption/encryption.module.js';
import { OrgSettingsModule } from '../modules/org-settings/org-settings.module.js';
import { NotificationWorker } from './notification.worker.js';
import { CampaignWorker } from './campaign.worker.js';
import { WebhookWorker } from './webhook.worker.js';
import { EmailWorker } from './email.worker.js';
import { EmailTemplatesService } from '../services/email-templates/email-templates.service.js';

@Module({
  imports: [
    EncryptionModule,
    OrgSettingsModule,
  ],
  providers: [
    NotificationWorker,
    CampaignWorker,
    WebhookWorker,
    EmailWorker,
    EmailTemplatesService,
  ],
  exports: [
    NotificationWorker,
    CampaignWorker,
    WebhookWorker,
    EmailWorker,
    EmailTemplatesService,
  ],
})
export class WorkersModule {}
