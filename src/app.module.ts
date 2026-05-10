import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// ─── Configuration ──────────────────────────────────────────────────────────
import configuration from './config/configuration.js';
import { envValidationSchema } from './config/validation.js';

// ─── JWT ─────────────────────────────────────────────────────────────────────
import { JwtModule } from '@nestjs/jwt';

// ─── Database ───────────────────────────────────────────────────────────────
import { PrismaModule } from './database/prisma.module.js';

// ─── Global Services ────────────────────────────────────────────────────────
import { CacheModule } from './services/cache/cache.module.js';
import { EncryptionModule } from './services/encryption/encryption.module.js';
import { ConfigResolverModule } from './services/config-resolver/config-resolver.module.js';
import { StorageModule } from './services/storage/storage.module.js';

// ─── Feature Modules ────────────────────────────────────────────────────────
import { AuthModule } from './modules/auth/auth.module.js';
import { OrganizationsModule } from './modules/organizations/organizations.module.js';
import { EndUserAuthModule } from './modules/end-user-auth/end-user-auth.module.js';
import { OrgSettingsModule } from './modules/org-settings/org-settings.module.js';
import { EndUserAddressesModule } from './modules/end-user-addresses/end-user-addresses.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { CartModule } from './modules/cart/cart.module.js';
import { CommerceOrdersModule } from './modules/commerce-orders/commerce-orders.module.js';
import { LocationsModule } from './modules/locations/locations.module.js';
import { PosModule } from './modules/pos/pos.module.js';
import { DeliveryModule } from './modules/delivery/delivery.module.js';
import { LoyaltyModule } from './modules/loyalty/loyalty.module.js';
import { CouponsModule } from './modules/coupons/coupons.module.js';
import { PromotionsModule } from './modules/promotions/promotions.module.js';
import { ReferralsModule } from './modules/referrals/referrals.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { MarketplaceModule } from './modules/marketplace/marketplace.module.js';
import { AppSubscriptionsModule } from './modules/app-subscriptions/app-subscriptions.module.js';
import { GiftCardsModule } from './modules/gift-cards/gift-cards.module.js';
import { ReservationsModule } from './modules/reservations/reservations.module.js';
import { SupportModule } from './modules/support/support.module.js';
import { ContactModule } from './modules/contact/contact.module.js';
import { ContentModule } from './modules/content/content.module.js';
import { ConversationalCommerceModule } from './modules/conversational-commerce/conversational-commerce.module.js';
import { PropertyModule } from './modules/property/property.module.js';
import { PropertyBookingsModule } from './modules/property-bookings/property-bookings.module.js';
import { PropertyInventoryModule } from './modules/property-inventory/property-inventory.module.js';
import { PropertyPricingModule } from './modules/property-pricing/property-pricing.module.js';
import { MoviesModule } from './modules/movies/movies.module.js';
import { WalletModule } from './modules/wallet/wallet.module.js';
import { WatchSessionsModule } from './modules/watch-sessions/watch-sessions.module.js';
import { RoomsModule } from './modules/rooms/rooms.module.js';
import { EarningsModule } from './modules/earnings/earnings.module.js';
import { UploadModule } from './modules/upload/upload.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { SuperAdminModule } from './modules/super-admin/super-admin.module.js';
import { ApiKeysModule } from './modules/api-keys/api-keys.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { BillingModule } from './modules/billing/billing.module.js';
import { CampaignsModule } from './modules/campaigns/campaigns.module.js';
import { EndUsersModule } from './modules/end-users/end-users.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { NotificationTemplatesModule } from './modules/notification-templates/notification-templates.module.js';
import { OrgConfigModule } from './modules/org-config/org-config.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { DakshinaBrokerModule } from './modules/dakshina-broker/dakshina-broker.module.js';
import { RolesModule } from './modules/roles/roles.module.js';
import { SegmentsModule } from './modules/segments/segments.module.js';
import { UsageModule } from './modules/usage/usage.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { WebhooksModule } from './modules/webhooks/webhooks.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { SuppliersModule } from './modules/suppliers/suppliers.module.js';
import { PurchaseOrdersModule } from './modules/purchase-orders/purchase-orders.module.js';
import { MealPlansModule } from './modules/meal-plans/meal-plans.module.js';
import { MealSubscriptionsModule } from './modules/meal-subscriptions/meal-subscriptions.module.js';
import { ConnectedSourcesModule } from './modules/connected-sources/connected-sources.module.js';
import { KycModule } from './modules/kyc/kyc.module.js';
import { BankAccountsModule } from './modules/bank-accounts/bank-accounts.module.js';
import { BankTransfersModule } from './modules/bank-transfers/bank-transfers.module.js';
import { BankCardsModule } from './modules/bank-cards/bank-cards.module.js';
import { BankingAnalyticsModule } from './modules/banking-analytics/banking-analytics.module.js';
// ─── SubRadar ────────────────────────────────────────────────────────────────
import { GmailAccountsModule } from './modules/gmail-accounts/gmail-accounts.module.js';
import { TrackedSubscriptionsModule } from './modules/tracked-subscriptions/tracked-subscriptions.module.js';
import { SubscriptionAlertsModule } from './modules/subscription-alerts/subscription-alerts.module.js';
import { SubscriptionSuggestionsModule } from './modules/subscription-suggestions/subscription-suggestions.module.js';
import { SubscriptionAnalyticsModule } from './modules/subscription-analytics/subscription-analytics.module.js';
// ─── Shopify Apps ───────────────────────────────────────────────────────────
import { SpinWheelsModule } from './modules/spin-wheels/spin-wheels.module.js';

// ─── Middleware ──────────────────────────────────────────────────────────────
import { StorefrontOrgMiddleware } from './common/middleware/storefront-org.middleware.js';

// ─── Workers, Gateways, Jobs ────────────────────────────────────────────────
import { WorkersModule } from './workers/workers.module.js';
import { GatewaysModule } from './gateways/gateways.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { CronModule } from './modules/cron/cron.module.js';

// ─── Guards ─────────────────────────────────────────────────────────────────
import { JwtAuthGuard } from './common/guards/jwt.guard.js';
import { MaintenanceGuard } from './common/guards/maintenance.guard.js';

// ─── Filters ────────────────────────────────────────────────────────────────
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter.js';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter.js';

// ─── Interceptors ───────────────────────────────────────────────────────────
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { AuditInterceptor } from './common/interceptors/audit.interceptor.js';
import { UsageInterceptor } from './common/interceptors/usage.interceptor.js';

@Module({
  imports: [
    // Configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),

    // Global rate limiting (60 requests per minute per IP)
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 60 }],
    }),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // JWT (global — used by JwtAuthGuard, SuperAdminGuard, etc.)
    JwtModule.register({ global: true }),

    // Global services
    CacheModule,
    EncryptionModule,
    ConfigResolverModule,
    StorageModule,

    // Feature modules
    AuthModule,
    OrganizationsModule,
    EndUserAuthModule,
    OrgSettingsModule,
    EndUserAddressesModule,
    CatalogModule,
    CartModule,
    CommerceOrdersModule,
    LocationsModule,
    PosModule,
    DeliveryModule,
    LoyaltyModule,
    CouponsModule,
    PromotionsModule,
    ReferralsModule,
    ReviewsModule,
    MarketplaceModule,
    AppSubscriptionsModule,
    GiftCardsModule,
    ReservationsModule,
    SupportModule,
    ContactModule,
    ContentModule,
    ConversationalCommerceModule,
    PropertyModule,
    PropertyBookingsModule,
    PropertyInventoryModule,
    PropertyPricingModule,
    MoviesModule,
    WalletModule,
    WatchSessionsModule,
    RoomsModule,
    EarningsModule,
    UploadModule,
    NotificationsModule,
    SuperAdminModule,
    ApiKeysModule,
    AuditModule,
    BillingModule,
    CampaignsModule,
    EndUsersModule,
    HealthModule,
    NotificationTemplatesModule,
    OrgConfigModule,
    PaymentsModule,
    DakshinaBrokerModule,
    RolesModule,
    SegmentsModule,
    UsageModule,
    UsersModule,
    WebhooksModule,
    InventoryModule,
    SuppliersModule,
    PurchaseOrdersModule,
    MealPlansModule,
    MealSubscriptionsModule,
    ConnectedSourcesModule,

    // Banking modules
    KycModule,
    BankAccountsModule,
    BankTransfersModule,
    BankCardsModule,
    BankingAnalyticsModule,

    // SubRadar modules
    GmailAccountsModule,
    TrackedSubscriptionsModule,
    SubscriptionAlertsModule,
    SubscriptionSuggestionsModule,
    SubscriptionAnalyticsModule,

    // Shopify Apps
    SpinWheelsModule,

    // Background workers
    WorkersModule,

    // WebSocket gateways
    GatewaysModule,

    // Scheduled jobs
    JobsModule,

    // Vercel cron HTTP endpoints
    CronModule,
  ],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Global JWT guard (use @Public() to skip)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Global maintenance mode guard (returns 503 when system.maintenance_mode is enabled)
    {
      provide: APP_GUARD,
      useClass: MaintenanceGuard,
    },

    // Global exception filters (order matters: most specific last)
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },

    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: UsageInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(StorefrontOrgMiddleware)
      .forRoutes('api/v1/storefront');
  }
}
