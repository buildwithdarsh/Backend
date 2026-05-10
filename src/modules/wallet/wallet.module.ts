import { Module } from '@nestjs/common';
import { EndUserAuthModule } from '../end-user-auth/end-user-auth.module.js';
import { WalletController } from './wallet.controller.js';
import { WalletService } from './wallet.service.js';

@Module({
  imports: [EndUserAuthModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
