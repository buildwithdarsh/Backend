import { Module } from '@nestjs/common';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { GiftCardsService } from './gift-cards.service.js';
import { AdminGiftCardsController } from './admin-gift-cards.controller.js';
import { StorefrontGiftCardsController } from './storefront-gift-cards.controller.js';

@Module({
  imports: [OrgSettingsModule],
  controllers: [AdminGiftCardsController, StorefrontGiftCardsController],
  providers: [GiftCardsService],
  exports: [GiftCardsService],
})
export class GiftCardsModule {}
