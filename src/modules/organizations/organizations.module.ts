import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service.js';
import {
  AdminOrganizationsController,
  OrgSelfController,
} from './organizations.controller.js';

@Module({
  controllers: [AdminOrganizationsController, OrgSelfController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
