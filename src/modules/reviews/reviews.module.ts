import { Module } from '@nestjs/common';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { LoyaltyModule } from '../loyalty/loyalty.module.js';
import { ReviewsService } from './reviews.service.js';
import { AdminReviewsController } from './admin-reviews.controller.js';
import { StorefrontReviewsController } from './storefront-reviews.controller.js';

@Module({
  imports: [OrgSettingsModule, LoyaltyModule],
  controllers: [AdminReviewsController, StorefrontReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
