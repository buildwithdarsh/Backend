import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { CouponsService } from './coupons.service.js';
import { ValidateCouponDto } from './dto/index.js';

@ApiTags('Storefront - Coupons')
@UseGuards(EndUserJwtGuard)
@Controller('api/v1/storefront/coupons')
export class StorefrontCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('validate')
  @ApiOperation({ summary: 'Validate a coupon code' })
  @ApiResponse({ status: 200, description: 'Coupon validation result' })
  @ApiResponse({ status: 400, description: 'Invalid or expired coupon' })
  validate(@Req() req: RequestWithOrg, @Body() dto: ValidateCouponDto) {
    return this.couponsService.validate(
      req.orgId,
      dto.code,
      req.endUser?.id ?? '',
      dto.orderAmount,
      dto.variantType,
      dto.orderType,
    );
  }
}
