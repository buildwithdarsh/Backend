import { Module } from '@nestjs/common';
import { EndUserAuthModule } from '../end-user-auth/end-user-auth.module.js';
import { BankingAnalyticsController } from './banking-analytics.controller.js';
import { BankingAnalyticsService } from './banking-analytics.service.js';

@Module({
  imports: [EndUserAuthModule],
  controllers: [BankingAnalyticsController],
  providers: [BankingAnalyticsService],
  exports: [BankingAnalyticsService],
})
export class BankingAnalyticsModule {}
