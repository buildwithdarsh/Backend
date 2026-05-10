import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetOrg } from '../../common/decorators/index.js';
import { PurchaseOrdersService } from './purchase-orders.service.js';
import {
  QueryPurchaseOrdersDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from './dto/index.js';

@ApiTags('Admin - Purchase Orders')
@Controller('api/v1/purchase-orders')
export class AdminPurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List all purchase orders for the organization' })
  @ApiResponse({ status: 200, description: 'Paginated purchase order list' })
  findAll(@GetOrg() orgId: string, @Query() query: QueryPurchaseOrdersDto) {
    return this.purchaseOrdersService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order detail' })
  @ApiResponse({ status: 200, description: 'Purchase order details' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  findOne(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.purchaseOrdersService.findOne(orgId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new purchase order' })
  @ApiResponse({ status: 201, description: 'Purchase order created' })
  create(
    @GetOrg() orgId: string,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.create(orgId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update purchase order status' })
  @ApiResponse({ status: 200, description: 'Purchase order updated' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a purchase order' })
  @ApiResponse({ status: 200, description: 'Purchase order deleted' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  remove(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.purchaseOrdersService.remove(orgId, id);
  }
}
