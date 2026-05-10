import { Module } from '@nestjs/common';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { MealSubscriptionsService } from './meal-subscriptions.service.js';
import { AdminMealSubscriptionsController } from './admin-meal-subscriptions.controller.js';
import { StorefrontMealSubscriptionsController } from './storefront-meal-subscriptions.controller.js';

@Module({
  imports: [OrgSettingsModule],
  controllers: [AdminMealSubscriptionsController, StorefrontMealSubscriptionsController],
  providers: [MealSubscriptionsService],
  exports: [MealSubscriptionsService],
})
export class MealSubscriptionsModule {}
