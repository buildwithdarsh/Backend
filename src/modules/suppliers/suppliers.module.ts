import { Module } from '@nestjs/common';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { SuppliersService } from './suppliers.service.js';
import { AdminSuppliersController } from './admin-suppliers.controller.js';

@Module({
  imports: [OrgSettingsModule],
  controllers: [AdminSuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
