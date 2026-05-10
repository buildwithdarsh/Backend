import { Module } from '@nestjs/common';
import { SpinWheelsService } from './spin-wheels.service.js';
import { AdminSpinWheelsController, AdminSpinWheelAnalyticsController } from './admin-spin-wheels.controller.js';
import { StorefrontSpinWheelsController } from './storefront-spin-wheels.controller.js';

@Module({
  controllers: [
    AdminSpinWheelsController,
    AdminSpinWheelAnalyticsController,
    StorefrontSpinWheelsController,
  ],
  providers: [SpinWheelsService],
  exports: [SpinWheelsService],
})
export class SpinWheelsModule {}
