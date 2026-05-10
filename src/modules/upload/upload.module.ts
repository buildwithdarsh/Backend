import { Module } from '@nestjs/common';
import { ConfigResolverModule } from '../../services/config-resolver/config-resolver.module.js';
import { StorefrontUploadController, AdminUploadController } from './upload.controller.js';
import { UploadService } from './upload.service.js';

@Module({
  imports: [ConfigResolverModule],
  controllers: [StorefrontUploadController, AdminUploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
