import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOrg } from '../../common/decorators/index.js';
import { CatalogService } from './catalog.service.js';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateItemDto,
  UpdateItemDto,
  CreateItemVariantDto,
  CreateOptionGroupDto,
  CreateOptionDto,
  QueryItemsDto,
} from './dto/index.js';

@ApiTags('Admin - Catalog')

@Controller('api/v1/catalog')
export class AdminCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ─── Categories ──────────────────────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'List all catalog categories' })
  @ApiResponse({ status: 200, description: 'All categories' })
  findAllCategories(@GetOrg() orgId: string) {
    return this.catalogService.findAllCategories(orgId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a catalog category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  createCategory(@GetOrg() orgId: string, @Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(orgId, dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a catalog category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  updateCategory(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.catalogService.updateCategory(orgId, id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Soft-delete a catalog category' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  deleteCategory(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.catalogService.deleteCategory(orgId, id);
  }

  // ─── Items ───────────────────────────────────────────────────────────────────

  @Get('items')
  @ApiOperation({ summary: 'List catalog items with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Paginated items list' })
  findAllItems(@GetOrg() orgId: string, @Query() query: QueryItemsDto) {
    return this.catalogService.findAllItems(orgId, query);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get a single catalog item with full details' })
  @ApiResponse({ status: 200, description: 'Full item details' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  findOneItem(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.catalogService.findOneItem(orgId, id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Create a catalog item' })
  @ApiResponse({ status: 201, description: 'Item created' })
  createItem(@GetOrg() orgId: string, @Body() dto: CreateItemDto) {
    return this.catalogService.createItem(orgId, dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update a catalog item' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  updateItem(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.catalogService.updateItem(orgId, id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Soft-delete a catalog item' })
  @ApiResponse({ status: 200, description: 'Item deleted' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  deleteItem(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.catalogService.deleteItem(orgId, id);
  }

  // ─── Variants ────────────────────────────────────────────────────────────────

  @Post('items/:id/variants')
  @ApiOperation({ summary: 'Create a variant for a catalog item' })
  @ApiResponse({ status: 201, description: 'Variant created' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  createItemVariant(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) itemId: string,
    @Body() dto: CreateItemVariantDto,
  ) {
    return this.catalogService.createItemVariant(orgId, itemId, dto);
  }

  @Patch('variants/:id')
  @ApiOperation({ summary: 'Update an item variant' })
  @ApiResponse({ status: 200, description: 'Variant updated' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  updateItemVariant(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateItemVariantDto,
  ) {
    return this.catalogService.updateItemVariant(orgId, id, dto);
  }

  @Delete('variants/:id')
  @ApiOperation({ summary: 'Delete an item variant' })
  @ApiResponse({ status: 200, description: 'Variant deleted' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  deleteItemVariant(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.catalogService.deleteItemVariant(orgId, id);
  }

  // ─── Option Groups & Options ─────────────────────────────────────────────────

  @Post('items/:id/option-groups')
  @ApiOperation({ summary: 'Create an option group for a catalog item' })
  @ApiResponse({ status: 201, description: 'Option group created' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  createOptionGroup(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) itemId: string,
    @Body() dto: CreateOptionGroupDto,
  ) {
    return this.catalogService.createOptionGroup(orgId, itemId, dto);
  }

  @Patch('option-groups/:id')
  @ApiOperation({ summary: 'Update an option group' })
  @ApiResponse({ status: 200, description: 'Option group updated' })
  @ApiResponse({ status: 404, description: 'Option group not found' })
  updateOptionGroup(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateOptionGroupDto,
  ) {
    return this.catalogService.updateOptionGroup(orgId, id, dto);
  }

  @Delete('option-groups/:id')
  @ApiOperation({ summary: 'Delete an option group' })
  @ApiResponse({ status: 200, description: 'Option group deleted' })
  @ApiResponse({ status: 404, description: 'Option group not found' })
  deleteOptionGroup(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    // Delete the group (cascades options via Prisma)
    return this.catalogService.deleteOptionGroup(orgId, id);
  }

  @Post('option-groups/:groupId/options')
  @ApiOperation({ summary: 'Create an option within an option group' })
  @ApiResponse({ status: 201, description: 'Option created' })
  @ApiResponse({ status: 404, description: 'Option group not found' })
  createOption(
    @GetOrg() orgId: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: CreateOptionDto,
  ) {
    return this.catalogService.createOption(orgId, groupId, dto);
  }

  @Patch('options/:id')
  @ApiOperation({ summary: 'Update an option' })
  @ApiResponse({ status: 200, description: 'Option updated' })
  @ApiResponse({ status: 404, description: 'Option not found' })
  updateOption(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateOptionDto,
  ) {
    return this.catalogService.updateOption(orgId, id, dto);
  }

  @Delete('options/:id')
  @ApiOperation({ summary: 'Delete an option' })
  @ApiResponse({ status: 200, description: 'Option deleted' })
  @ApiResponse({ status: 404, description: 'Option not found' })
  deleteOption(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.catalogService.deleteOption(orgId, id);
  }
}
