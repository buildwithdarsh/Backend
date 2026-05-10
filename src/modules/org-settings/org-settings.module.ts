import { Module } from '@nestjs/common';
import { OrgSettingsService } from './org-settings.service.js';
import { OrgSettingsController } from './org-settings.controller.js';
import { EncryptionModule } from '../../services/encryption/encryption.module.js';

@Module({
  imports: [EncryptionModule],
  controllers: [OrgSettingsController],
  providers: [OrgSettingsService],
  exports: [OrgSettingsService],
})
export class OrgSettingsModule {}
