import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { EndUserAuthModule } from '../end-user-auth/end-user-auth.module.js';
import { CommerceOrdersService } from './commerce-orders.service.js';
import { AdminOrdersController } from './admin-orders.controller.js';
import { StorefrontOrdersController } from './storefront-orders.controller.js';

@Module({
  imports: [
    PassportModule,
    OrgSettingsModule,
    forwardRef(() => PaymentsModule),
    forwardRef(() => EndUserAuthModule),
  ],
  controllers: [AdminOrdersController, StorefrontOrdersController],
  providers: [CommerceOrdersService],
  exports: [CommerceOrdersService],
})
export class CommerceOrdersModule {}
