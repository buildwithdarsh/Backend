import { Module } from '@nestjs/common';
import { NotificationTemplatesService } from './notification-templates.service.js';
import { NotificationTemplatesController } from './notification-templates.controller.js';

@Module({
  controllers: [NotificationTemplatesController],
  providers: [NotificationTemplatesService],
  exports: [NotificationTemplatesService],
})
export class NotificationTemplatesModule {}
