import { Module } from '@nestjs/common';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { PaymentsController } from './payments.controller.js';
import { StorefrontPaymentsController } from './storefront-payments.controller.js';
import { PaymentsService } from './services/payments.service.js';
import { OrdersService } from './services/orders.service.js';
import { SubscriptionsService } from './services/subscriptions.service.js';
import { RefundsService } from './services/refunds.service.js';
import { PaymentLinksService } from './services/payment-links.service.js';
import { WebhookHandlerService } from './services/webhook-handler.service.js';
import { ProductsService } from './services/products.service.js';
import { PaymentProviderFactory } from './providers/payment-provider.factory.js';

@Module({
  imports: [OrgSettingsModule],
  controllers: [PaymentsController, StorefrontPaymentsController],
  providers: [
    PaymentProviderFactory,
    PaymentsService,
    OrdersService,
    SubscriptionsService,
    RefundsService,
    PaymentLinksService,
    WebhookHandlerService,
    ProductsService,
  ],
  exports: [
    PaymentsService,
    OrdersService,
    SubscriptionsService,
    RefundsService,
    PaymentLinksService,
    ProductsService,
    PaymentProviderFactory,
  ],
})
export class PaymentsModule {}
