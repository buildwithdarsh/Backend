import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { OrdersService } from './services/orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { VerifyPaymentDto } from './dto/verify-payment.dto.js';

@ApiTags('Storefront Payments')
@Controller('api/v1/storefront/payments')
@UseGuards(EndUserJwtGuard)
export class StorefrontPaymentsController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('create-order')
  async createOrder(@Body() dto: CreateOrderDto, @Req() req: RequestWithOrg) {
    // Always use authenticated user's ID — never trust client-supplied endUserId
    if (req.endUser?.id) {
      dto.endUserId = req.endUser.id;
    }
    return this.ordersService.create(req.orgId, dto);
  }

  @Post('verify')
  async verify(
    @Body() dto: VerifyPaymentDto & { orderId: string },
    @Req() req: RequestWithOrg,
  ) {
    return this.ordersService.verify(req.orgId, dto.orderId, dto);
  }
}
