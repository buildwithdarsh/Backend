import { Module } from '@nestjs/common';
import { PropertyService } from './property.service.js';
import { AdminPropertyController } from './admin-property.controller.js';
import { StorefrontPropertyController } from './storefront-property.controller.js';

@Module({
  controllers: [AdminPropertyController, StorefrontPropertyController],
  providers: [PropertyService],
  exports: [PropertyService],
})
export class PropertyModule {}
