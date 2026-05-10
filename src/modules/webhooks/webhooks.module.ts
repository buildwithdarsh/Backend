import { Module } from '@nestjs/common';
import { EncryptionModule } from '../../services/encryption/encryption.module.js';
import { WorkersModule } from '../../workers/workers.module.js';
import { WebhooksService } from './webhooks.service.js';
import { WebhooksController } from './webhooks.controller.js';

@Module({
  imports: [
    EncryptionModule,
    WorkersModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
