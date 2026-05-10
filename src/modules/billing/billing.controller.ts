import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service.js';
import { SubscribeDto } from './dto/subscribe.dto.js';
import { QueryInvoicesDto } from './dto/query-invoices.dto.js';
import { GetOrg, Public } from '../../common/decorators/index.js';

@ApiTags('Billing')
@Controller('api/v1/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plan')
  @ApiOperation({ summary: 'Get current plan and usage summary' })
  @ApiResponse({ status: 200, description: 'Current plan with usage' })
  getCurrentPlan(@GetOrg() orgId: string) {
    return this.billingService.getCurrentPlan(orgId);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List all available plans' })
  @ApiResponse({ status: 200, description: 'List of active plans' })
  listPlans() {
    return this.billingService.listPlans();
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to a plan' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  subscribe(@GetOrg() orgId: string, @Body() dto: SubscribeDto) {
    return this.billingService.subscribe(orgId, dto);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel current subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  @ApiResponse({ status: 400, description: 'No active plan' })
  cancelSubscription(@GetOrg() orgId: string) {
    return this.billingService.cancelSubscription(orgId);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated invoices' })
  listInvoices(@GetOrg() orgId: string, @Query() dto: QueryInvoicesDto) {
    return this.billingService.listInvoices(orgId, dto);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  getInvoice(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.billingService.getInvoice(orgId, id);
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Handle billing provider webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  handleWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers('x-razorpay-signature') razorpaySignature?: string,
    @Headers('stripe-signature') stripeSignature?: string,
  ) {
    const provider = stripeSignature ? 'stripe' : 'razorpay';
    const signature = stripeSignature ?? razorpaySignature;
    return this.billingService.handleWebhook(provider, payload, signature);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get current period usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics' })
  getUsage(@GetOrg() orgId: string) {
    return this.billingService.getUsage(orgId);
  }
}
