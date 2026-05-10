import { Module } from '@nestjs/common';
import { SubscriptionAnalyticsController } from './subscription-analytics.controller.js';
import { SubscriptionAnalyticsService } from './subscription-analytics.service.js';

@Module({
  controllers: [SubscriptionAnalyticsController],
  providers: [SubscriptionAnalyticsService],
  exports: [SubscriptionAnalyticsService],
})
export class SubscriptionAnalyticsModule {}
