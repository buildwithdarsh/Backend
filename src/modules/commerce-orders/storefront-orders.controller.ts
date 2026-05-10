import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { CommerceOrdersService } from './commerce-orders.service.js';
import { CreateOrderDto, QueryOrdersDto } from './dto/index.js';

@ApiTags('Storefront - Orders')
@UseGuards(EndUserJwtGuard)
@Controller('api/v1/storefront/orders')
export class StorefrontOrdersController {
  constructor(private readonly ordersService: CommerceOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Place a new order from the storefront' })
  @ApiResponse({ status: 201, description: 'Order created' })
  create(@Req() req: RequestWithOrg, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.orgId, req.endUser!.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List own orders' })
  @ApiResponse({ status: 200, description: 'Paginated order list' })
  findAll(@Req() req: RequestWithOrg, @Query() query: QueryOrdersDto) {
    return this.ordersService.findByEndUser(req.orgId, req.endUser!.id, query);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Re-order items from a previous order' })
  @ApiResponse({ status: 201, description: 'Items added to cart' })
  async reorder(@Body() body: { orderId: string }, @Req() req: RequestWithOrg) {
    return this.ordersService.reorder(req.orgId, req.endUser?.id ?? '', body.orderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Req() req: RequestWithOrg, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(req.orgId, id, req.endUser!.id);
  }

  @Post(':id/issue')
  @ApiOperation({ summary: 'Report an issue with an order' })
  @ApiResponse({ status: 201, description: 'Issue reported' })
  async reportIssue(
    @Param('id') orderId: string,
    @Body() body: { issue: string; description?: string },
    @Req() req: RequestWithOrg,
  ) {
    // findOne with endUserId ensures the order belongs to this user
    await this.ordersService.findOne(req.orgId, orderId, req.endUser!.id);

    return this.ordersService.reportIssue(req.orgId, req.endUser!.id, orderId, body.issue, body.description);
  }
}
