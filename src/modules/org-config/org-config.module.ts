import { Module } from '@nestjs/common';
import { OrgConfigService } from './org-config.service.js';
import {
  AdminOrgConfigController,
  AdminPlatformConfigController,
} from './org-config.controller.js';

@Module({
  controllers: [AdminOrgConfigController, AdminPlatformConfigController],
  providers: [OrgConfigService],
  exports: [OrgConfigService],
})
export class OrgConfigModule {}
