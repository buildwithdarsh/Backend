import { Module } from '@nestjs/common';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { ReservationsService } from './reservations.service.js';
import { AdminReservationsController } from './admin-reservations.controller.js';
import { StorefrontReservationsController } from './storefront-reservations.controller.js';

@Module({
  imports: [OrgSettingsModule],
  controllers: [AdminReservationsController, StorefrontReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
