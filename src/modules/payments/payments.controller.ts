import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GetOrg } from '../../common/decorators/get-org.decorator.js';
import { GetUser } from '../../common/decorators/get-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import type { RequestWithOrg } from '../../common/types/request.types.js';
import { PaymentsService } from './services/payments.service.js';
import { OrdersService } from './services/orders.service.js';
import { SubscriptionsService } from './services/subscriptions.service.js';
import { RefundsService } from './services/refunds.service.js';
import { PaymentLinksService } from './services/payment-links.service.js';
import { WebhookHandlerService } from './services/webhook-handler.service.js';
import { ProductsService } from './services/products.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { VerifyPaymentDto } from './dto/verify-payment.dto.js';
import { CreateSubscriptionDto } from './dto/create-subscription.dto.js';
import { CreateRefundDto } from './dto/create-refund.dto.js';
import { CreatePaymentLinkDto } from './dto/create-payment-link.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import {
  QueryPaymentsDto,
  QueryOrdersDto,
  QuerySubscriptionsDto,
} from './dto/query-payments.dto.js';

@ApiTags('Payments')
@Controller('api/v1/payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly ordersService: OrdersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly refundsService: RefundsService,
    private readonly paymentLinksService: PaymentLinksService,
    private readonly webhookHandlerService: WebhookHandlerService,
    private readonly productsService: ProductsService,
  ) {}

  // ─── Payments ─────────────────────────────────────────────────────────────

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List payments' })
  async listPayments(
    @GetOrg() orgId: string,
    @Query() dto: QueryPaymentsDto,
  ) {
    return this.paymentsService.findAll(orgId, dto);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment detail' })
  async getPayment(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentsService.findOne(orgId, id);
  }

  // ─── Orders ───────────────────────────────────────────────────────────────

  @Post('orders')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an order' })
  async createOrder(
    @GetOrg() orgId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(orgId, dto, userId);
  }

  @Post('orders/:id/verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify and capture payment for an order' })
  async verifyOrder(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.ordersService.verify(orgId, id, dto);
  }

  @Get('orders')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List orders' })
  async listOrders(
    @GetOrg() orgId: string,
    @Query() dto: QueryOrdersDto,
  ) {
    return this.ordersService.findAll(orgId, dto);
  }

  @Get('orders/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order detail' })
  async getOrder(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.findOne(orgId, id);
  }

  // ─── Subscriptions ────────────────────────────────────────────────────────

  @Post('subscriptions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a subscription' })
  async createSubscription(
    @GetOrg() orgId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(orgId, dto, userId);
  }

  @Get('subscriptions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List subscriptions' })
  async listSubscriptions(
    @GetOrg() orgId: string,
    @Query() dto: QuerySubscriptionsDto,
  ) {
    return this.subscriptionsService.findAll(orgId, dto);
  }

  @Get('subscriptions/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription detail' })
  async getSubscription(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.subscriptionsService.findOne(orgId, id);
  }

  @Post('subscriptions/:id/pause')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pause a subscription' })
  async pauseSubscription(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.subscriptionsService.pause(orgId, id);
  }

  @Post('subscriptions/:id/resume')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resume a paused subscription' })
  async resumeSubscription(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.subscriptionsService.resume(orgId, id);
  }

  @Post('subscriptions/:id/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a subscription' })
  async cancelSubscription(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.subscriptionsService.cancel(orgId, id);
  }

  // ─── Refunds ──────────────────────────────────────────────────────────────

  @Post(':paymentId/refunds')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a refund for a payment' })
  async createRefund(
    @GetOrg() orgId: string,
    @GetUser('id') userId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() dto: CreateRefundDto,
  ) {
    return this.refundsService.create(orgId, paymentId, dto, userId);
  }

  @Get(':paymentId/refunds')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List refunds for a payment' })
  async listRefunds(
    @GetOrg() orgId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ) {
    return this.refundsService.findByPayment(orgId, paymentId);
  }

  // ─── Payment Links ────────────────────────────────────────────────────────

  @Post('links')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a payment link' })
  async createPaymentLink(
    @GetOrg() orgId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreatePaymentLinkDto,
  ) {
    return this.paymentLinksService.create(orgId, dto, userId);
  }

  @Get('links')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List payment links' })
  async listPaymentLinks(
    @GetOrg() orgId: string,
    @Query() dto: PaginationDto,
  ) {
    return this.paymentLinksService.findAll(orgId, dto);
  }

  @Get('links/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment link detail' })
  async getPaymentLink(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentLinksService.findOne(orgId, id);
  }

  @Post('links/:id/deactivate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a payment link' })
  async deactivatePaymentLink(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentLinksService.deactivate(orgId, id);
  }

  @Delete('links/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a payment link' })
  async deletePaymentLink(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentLinksService.remove(orgId, id);
  }

  // ─── Products ─────────────────────────────────────────────────────────────

  @Post('products')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product' })
  async createProduct(
    @GetOrg() orgId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(orgId, dto, userId);
  }

  @Get('products')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List products' })
  async listProducts(
    @GetOrg() orgId: string,
    @Query() dto: PaginationDto,
  ) {
    return this.productsService.findAll(orgId, dto);
  }

  @Get('products/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get product detail' })
  async getProduct(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.findOne(orgId, id);
  }

  @Patch('products/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  async updateProduct(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(orgId, id, dto);
  }

  @Delete('products/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product' })
  async deleteProduct(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.remove(orgId, id);
  }

  // ─── Webhooks (Public) ────────────────────────────────────────────────────

  @Public()
  @Post('webhook/razorpay')
  @ApiOperation({ summary: 'Razorpay webhook handler (org ID via header)' })
  async razorpayWebhook(
    @Req() _req: RequestWithOrg,
    @Headers('x-razorpay-signature') signature: string,
    @Headers('x-org-id') orgId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.webhookHandlerService.handleRazorpayWebhook(
      payload,
      signature,
      orgId,
    );
  }

  @Public()
  @Post('webhook/razorpay/:orgId')
  @ApiOperation({ summary: 'Razorpay webhook handler (org ID via URL)' })
  async razorpayWebhookWithOrgId(
    @Param('orgId') orgId: string,
    @Headers('x-razorpay-signature') signature: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.webhookHandlerService.handleRazorpayWebhook(
      payload,
      signature,
      orgId,
    );
  }

  @Public()
  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async stripeWebhook(
    @Req() _req: RequestWithOrg,
    @Headers('stripe-signature') signature: string,
    @Headers('x-org-id') orgId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.webhookHandlerService.handleStripeWebhook(
      payload,
      signature,
      orgId,
    );
  }
}
