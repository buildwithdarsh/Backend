import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service.js';
import { AdminLocationsController } from './admin-locations.controller.js';
import { StorefrontLocationsController } from './storefront-locations.controller.js';

@Module({
  controllers: [AdminLocationsController, StorefrontLocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
