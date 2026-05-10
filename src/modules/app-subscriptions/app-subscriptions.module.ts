import { Module } from '@nestjs/common';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { AppSubscriptionsService } from './app-subscriptions.service.js';
import { AppSubscriptionsController } from './app-subscriptions.controller.js';

@Module({
  imports: [OrgSettingsModule],
  controllers: [AppSubscriptionsController],
  providers: [AppSubscriptionsService],
  exports: [AppSubscriptionsService],
})
export class AppSubscriptionsModule {}
