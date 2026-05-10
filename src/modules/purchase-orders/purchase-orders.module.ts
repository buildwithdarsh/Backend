import { Module } from '@nestjs/common';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { PurchaseOrdersService } from './purchase-orders.service.js';
import { AdminPurchaseOrdersController } from './admin-purchase-orders.controller.js';

@Module({
  imports: [OrgSettingsModule],
  controllers: [AdminPurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
