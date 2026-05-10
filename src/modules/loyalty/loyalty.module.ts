import { Module } from '@nestjs/common';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { LoyaltyService } from './loyalty.service.js';
import { AdminLoyaltyController } from './admin-loyalty.controller.js';
import { StorefrontLoyaltyController } from './storefront-loyalty.controller.js';

@Module({
  imports: [OrgSettingsModule],
  controllers: [AdminLoyaltyController, StorefrontLoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
