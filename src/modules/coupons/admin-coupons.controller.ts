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
import { CouponsService } from './coupons.service.js';
import { CreateCouponDto, UpdateCouponDto, QueryCouponsDto } from './dto/index.js';

@ApiTags('Admin - Coupons')

@Controller('api/v1/coupons')
export class AdminCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  @ApiOperation({ summary: 'List all coupons with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Paginated coupons list' })
  findAll(@GetOrg() orgId: string, @Query() query: QueryCouponsDto) {
    return this.couponsService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single coupon with usage history' })
  @ApiResponse({ status: 200, description: 'Coupon details' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  findOne(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.couponsService.findOne(orgId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new coupon' })
  @ApiResponse({ status: 201, description: 'Coupon created' })
  create(@GetOrg() orgId: string, @Body() dto: CreateCouponDto) {
    return this.couponsService.create(orgId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a coupon' })
  @ApiResponse({ status: 200, description: 'Coupon updated' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponsService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a coupon' })
  @ApiResponse({ status: 200, description: 'Coupon deleted' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  remove(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.couponsService.remove(orgId, id);
  }
}
