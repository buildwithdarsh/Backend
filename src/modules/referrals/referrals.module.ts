import { Module } from '@nestjs/common';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { ReferralsService } from './referrals.service.js';
import { StorefrontReferralsController } from './storefront-referrals.controller.js';

@Module({
  imports: [OrgSettingsModule],
  controllers: [StorefrontReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
