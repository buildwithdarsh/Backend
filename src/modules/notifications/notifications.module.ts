import { Module } from '@nestjs/common';
import { WorkersModule } from '../../workers/workers.module.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsController } from './notifications.controller.js';
import { StorefrontNotificationsController } from './storefront-notifications.controller.js';

@Module({
  imports: [
    WorkersModule,
  ],
  controllers: [NotificationsController, StorefrontNotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
