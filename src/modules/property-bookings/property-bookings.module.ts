import { Module } from '@nestjs/common';
import { PropertyBookingsService } from './property-bookings.service.js';
import { AdminBookingsController } from './admin-bookings.controller.js';
import { StorefrontBookingsController } from './storefront-bookings.controller.js';

@Module({
  controllers: [AdminBookingsController, StorefrontBookingsController],
  providers: [PropertyBookingsService],
  exports: [PropertyBookingsService],
})
export class PropertyBookingsModule {}
