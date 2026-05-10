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
import { InventoryService } from './inventory.service.js';
import {
  QueryInventoryDto,
  CreateIngredientDto,
  UpdateIngredientDto,
  CreateWasteLogDto,
} from './dto/index.js';

@ApiTags('Admin - Inventory')
@Controller('api/v1/inventory')
export class AdminInventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List all ingredients with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated ingredients list' })
  findAll(@GetOrg() orgId: string, @Query() query: QueryInventoryDto) {
    return this.inventoryService.findAll(orgId, query);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'List all stock alerts' })
  @ApiResponse({ status: 200, description: 'Stock alerts list' })
  findAlerts(@GetOrg() orgId: string) {
    return this.inventoryService.findAlerts(orgId);
  }

  @Get('waste')
  @ApiOperation({ summary: 'List all waste logs' })
  @ApiResponse({ status: 200, description: 'Waste logs list' })
  findWasteLogs(@GetOrg() orgId: string) {
    return this.inventoryService.findWasteLogs(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single ingredient' })
  @ApiResponse({ status: 200, description: 'Ingredient details' })
  @ApiResponse({ status: 404, description: 'Ingredient not found' })
  findOne(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findOne(orgId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new ingredient' })
  @ApiResponse({ status: 201, description: 'Ingredient created' })
  create(@GetOrg() orgId: string, @Body() dto: CreateIngredientDto) {
    return this.inventoryService.create(orgId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an ingredient' })
  @ApiResponse({ status: 200, description: 'Ingredient updated' })
  @ApiResponse({ status: 404, description: 'Ingredient not found' })
  update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.inventoryService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an ingredient' })
  @ApiResponse({ status: 200, description: 'Ingredient deleted' })
  @ApiResponse({ status: 404, description: 'Ingredient not found' })
  remove(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.remove(orgId, id);
  }

  @Patch('alerts/:id')
  @ApiOperation({ summary: 'Resolve a stock alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  resolveAlert(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.resolveAlert(orgId, id);
  }

  @Post('waste')
  @ApiOperation({ summary: 'Create a waste log entry' })
  @ApiResponse({ status: 201, description: 'Waste log created' })
  createWasteLog(@GetOrg() orgId: string, @Body() dto: CreateWasteLogDto) {
    return this.inventoryService.createWasteLog(orgId, dto);
  }
}
