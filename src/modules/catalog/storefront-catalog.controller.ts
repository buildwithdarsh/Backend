import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { CatalogService } from './catalog.service.js';
import { QueryItemsDto } from './dto/index.js';

@ApiTags('Storefront - Catalog')
@Controller('api/v1/storefront/catalog')
export class StorefrontCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'List active catalog categories' })
  @ApiResponse({ status: 200, description: 'Active categories list' })
  findAllCategories(@Req() req: RequestWithOrg) {
    return this.catalogService.findAllCategories(req.orgId, true);
  }

  @Public()
  @Get('items')
  @ApiOperation({ summary: 'List catalog items with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Paginated items list' })
  findAllItems(@Req() req: RequestWithOrg, @Query() query: QueryItemsDto) {
    return this.catalogService.findAllItems(req.orgId, query);
  }

  @Public()
  @Get('items/:id')
  @ApiOperation({ summary: 'Get a single catalog item with full details' })
  @ApiResponse({ status: 200, description: 'Full item details' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  findOneItem(@Req() req: RequestWithOrg, @Param('id', ParseUUIDPipe) id: string) {
    return this.catalogService.findOneItem(req.orgId, id);
  }
}
