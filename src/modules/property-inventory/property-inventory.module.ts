import { Module } from '@nestjs/common';
import { PropertyInventoryService } from './property-inventory.service.js';
import { AdminInventoryController } from './admin-inventory.controller.js';
import { StorefrontInventoryController } from './storefront-inventory.controller.js';

@Module({
  controllers: [AdminInventoryController, StorefrontInventoryController],
  providers: [PropertyInventoryService],
  exports: [PropertyInventoryService],
})
export class PropertyInventoryModule {}
