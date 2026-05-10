import { Module } from '@nestjs/common';
import { SubscriptionAlertsController } from './subscription-alerts.controller.js';
import { SubscriptionAlertsService } from './subscription-alerts.service.js';

@Module({
  controllers: [SubscriptionAlertsController],
  providers: [SubscriptionAlertsService],
  exports: [SubscriptionAlertsService],
})
export class SubscriptionAlertsModule {}
