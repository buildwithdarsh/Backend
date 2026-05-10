import {
  Body,
  Controller,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { PropertyPricingService } from './property-pricing.service.js';
import { ResolvePriceDto } from './dto/index.js';

@ApiTags('Storefront - Property Pricing')
@Controller('api/v1/storefront/property/pricing')
export class StorefrontPricingController {
  constructor(private readonly pricingService: PropertyPricingService) {}

  @Public()
  @Post('resolve')
  @ApiOperation({ summary: 'Calculate price for dates (public)' })
  @ApiResponse({ status: 200, description: 'Price breakdown' })
  resolve(@Req() req: RequestWithOrg, @Body() dto: ResolvePriceDto) {
    return this.pricingService.resolvePrice(
      req.orgId,
      dto.propertyTypeId,
      dto.checkInDate,
      dto.checkOutDate,
      dto.guestCount,
    );
  }
}
