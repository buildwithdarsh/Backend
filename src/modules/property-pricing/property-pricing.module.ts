import { Module } from '@nestjs/common';
import { PropertyPricingService } from './property-pricing.service.js';
import { AdminPricingController } from './admin-pricing.controller.js';
import { StorefrontPricingController } from './storefront-pricing.controller.js';

@Module({
  controllers: [AdminPricingController, StorefrontPricingController],
  providers: [PropertyPricingService],
  exports: [PropertyPricingService],
})
export class PropertyPricingModule {}
