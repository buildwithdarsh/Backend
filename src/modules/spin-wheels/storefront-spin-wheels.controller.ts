import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { SpinWheelsService } from './spin-wheels.service.js';
import { StorefrontSpinDto, StorefrontImpressionDto } from './dto/index.js';

@ApiTags('Storefront - SpinWheel')
@Public()
@Controller('api/v1/shopify/spinwheel/storefront')
export class StorefrontSpinWheelsController {
  constructor(private readonly spinWheelsService: SpinWheelsService) {}

  @Get(':shopDomain/active')
  @ApiOperation({ summary: 'Get active campaign for a shop (called by storefront widget)' })
  @ApiResponse({ status: 200, description: 'Active campaign with slices' })
  getActiveCampaign(@Param('shopDomain') shopDomain: string) {
    return this.spinWheelsService.getActiveCampaign(shopDomain);
  }

  @Post('spin')
  @ApiOperation({ summary: 'Record a spin and resolve the prize' })
  @ApiResponse({ status: 200, description: 'Spin result with prize details' })
  recordSpin(@Body() dto: StorefrontSpinDto, @Req() req: RequestWithOrg) {
    const ip = req.headers['x-forwarded-for'] as string ?? req.ip;
    const ua = req.headers['user-agent'] as string;
    return this.spinWheelsService.recordSpin(dto, ip, ua);
  }

  @Post('impression')
  @ApiOperation({ summary: 'Record a widget impression' })
  @ApiResponse({ status: 200, description: 'Impression recorded' })
  recordImpression(@Body() dto: StorefrontImpressionDto) {
    return this.spinWheelsService.recordImpression(dto);
  }
}
