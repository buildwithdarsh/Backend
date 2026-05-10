import { Module } from '@nestjs/common';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { MealPlansService } from './meal-plans.service.js';
import { AdminMealPlansController } from './admin-meal-plans.controller.js';

@Module({
  imports: [OrgSettingsModule],
  controllers: [AdminMealPlansController],
  providers: [MealPlansService],
  exports: [MealPlansService],
})
export class MealPlansModule {}
