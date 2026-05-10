import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import { AdminCatalogController } from './admin-catalog.controller.js';
import { StorefrontCatalogController } from './storefront-catalog.controller.js';

@Module({
  controllers: [AdminCatalogController, StorefrontCatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
