import { Module } from '@nestjs/common';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { CouponsService } from './coupons.service.js';
import { AdminCouponsController } from './admin-coupons.controller.js';
import { StorefrontCouponsController } from './storefront-coupons.controller.js';

@Module({
  imports: [OrgSettingsModule],
  controllers: [AdminCouponsController, StorefrontCouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
