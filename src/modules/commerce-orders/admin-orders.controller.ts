import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetOrg } from '../../common/decorators/index.js';
import { CommerceOrdersService } from './commerce-orders.service.js';
import { QueryOrdersDto, UpdateOrderStatusDto } from './dto/index.js';

@ApiTags('Admin - Commerce Orders')

@Controller('api/v1/commerce/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: CommerceOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List all orders for the organization' })
  @ApiResponse({ status: 200, description: 'Paginated order list' })
  findAll(@GetOrg() orgId: string, @Query() query: QueryOrdersDto) {
    return this.ordersService.findAll(orgId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Order statistics' })
  getStats(@GetOrg() orgId: string) {
    return this.ordersService.getOrderStats(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(orgId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateStatus(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(orgId, id, dto);
  }
}
