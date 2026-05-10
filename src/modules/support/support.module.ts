import { Module } from '@nestjs/common';
import { SupportService } from './support.service.js';
import { AdminSupportController } from './admin-support.controller.js';
import { StorefrontSupportController } from './storefront-support.controller.js';

@Module({
  controllers: [AdminSupportController, StorefrontSupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
