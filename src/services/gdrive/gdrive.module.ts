import { Global, Module } from '@nestjs/common';
import { GDriveService } from './gdrive.service.js';

@Global()
@Module({
  providers: [GDriveService],
  exports: [GDriveService],
})
export class GDriveModule {}
