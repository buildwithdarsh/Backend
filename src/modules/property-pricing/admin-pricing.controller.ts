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
import { PropertyPricingService } from './property-pricing.service.js';
import {
  CreatePricingRuleDto,
  UpdatePricingRuleDto,
  ResolvePriceDto,
} from './dto/index.js';

@ApiTags('Admin - Property Pricing')

@Controller('api/v1/property/pricing')
export class AdminPricingController {
  constructor(private readonly pricingService: PropertyPricingService) {}

  @Get()
  @ApiOperation({ summary: 'List all pricing rules' })
  @ApiResponse({ status: 200, description: 'All pricing rules' })
  findAll(
    @GetOrg() orgId: string,
    @Query('propertyTypeId') propertyTypeId?: string,
  ) {
    return this.pricingService.findAll(orgId, propertyTypeId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a pricing rule' })
  @ApiResponse({ status: 201, description: 'Pricing rule created' })
  create(@GetOrg() orgId: string, @Body() dto: CreatePricingRuleDto) {
    return this.pricingService.createRule(orgId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a pricing rule' })
  @ApiResponse({ status: 200, description: 'Pricing rule updated' })
  @ApiResponse({ status: 404, description: 'Pricing rule not found' })
  update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePricingRuleDto,
  ) {
    return this.pricingService.updateRule(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a pricing rule' })
  @ApiResponse({ status: 200, description: 'Pricing rule deleted' })
  @ApiResponse({ status: 404, description: 'Pricing rule not found' })
  remove(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.pricingService.removeRule(orgId, id);
  }

  @Post('resolve')
  @ApiOperation({ summary: 'Resolve effective price for a stay' })
  @ApiResponse({ status: 200, description: 'Price breakdown' })
  resolve(@GetOrg() orgId: string, @Body() dto: ResolvePriceDto) {
    return this.pricingService.resolvePrice(
      orgId,
      dto.propertyTypeId,
      dto.checkInDate,
      dto.checkOutDate,
      dto.guestCount,
    );
  }
}
