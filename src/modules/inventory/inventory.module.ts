import { Module } from '@nestjs/common';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { InventoryService } from './inventory.service.js';
import { AdminInventoryController } from './admin-inventory.controller.js';

@Module({
  imports: [OrgSettingsModule],
  controllers: [AdminInventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
