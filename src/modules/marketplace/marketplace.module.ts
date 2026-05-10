import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service.js';
import { StorefrontMarketplaceController } from './storefront-marketplace.controller.js';
import { AdminMarketplaceController } from './admin-marketplace.controller.js';
import { AppSubscriptionsModule } from '../app-subscriptions/app-subscriptions.module.js';

@Module({
  imports: [AppSubscriptionsModule],
  controllers: [StorefrontMarketplaceController, AdminMarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
