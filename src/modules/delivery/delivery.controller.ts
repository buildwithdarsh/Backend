import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { DeliveryService } from './delivery.service.js';
import { CalculateDeliveryDto } from './dto/index.js';

@ApiTags('Storefront - Delivery')
@Controller('api/v1/storefront/delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Public()
  @Post('calculate')
  @ApiOperation({ summary: 'Calculate delivery fee and ETA' })
  @ApiResponse({ status: 200, description: 'Delivery fee and estimated time' })
  calculate(@Req() req: RequestWithOrg, @Body() dto: CalculateDeliveryDto) {
    return this.deliveryService.calculateFee(
      req.orgId,
      dto.locationId,
      dto.pincode,
      dto.lat,
      dto.lng,
    );
  }

  @Public()
  @Post('fee')
  @ApiOperation({ summary: 'Calculate delivery fee (alias for /calculate)' })
  @ApiResponse({ status: 200, description: 'Delivery fee and estimated time' })
  calculateFeeAlias(@Req() req: RequestWithOrg, @Body() dto: CalculateDeliveryDto) {
    return this.calculate(req, dto);
  }

  @UseGuards(EndUserJwtGuard)
  @Get('orders/:orderId/tracking')
  @ApiOperation({ summary: 'Get delivery tracking info for an order' })
  @ApiResponse({ status: 200, description: 'Delivery tracking information' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getTracking(
    @Req() req: RequestWithOrg,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.deliveryService.getOrderTracking(
      req.orgId,
      req.endUser!.id,
      orderId,
    );
  }
}
