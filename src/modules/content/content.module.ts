import { Module } from '@nestjs/common';
import { ContentService } from './content.service.js';
import { AdminContentController } from './admin-content.controller.js';
import { StorefrontContentController } from './storefront-content.controller.js';

@Module({
  controllers: [AdminContentController, StorefrontContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
