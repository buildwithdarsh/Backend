import { Module } from '@nestjs/common';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { DeliveryService } from './delivery.service.js';
import { DeliveryController } from './delivery.controller.js';

@Module({
  imports: [OrgSettingsModule],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
