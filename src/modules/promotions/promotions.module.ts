import { Module } from '@nestjs/common';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { PromotionsService } from './promotions.service.js';
import { AdminPromotionsController } from './admin-promotions.controller.js';
import { StorefrontPromotionsController } from './storefront-promotions.controller.js';

@Module({
  imports: [OrgSettingsModule],
  controllers: [AdminPromotionsController, StorefrontPromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
