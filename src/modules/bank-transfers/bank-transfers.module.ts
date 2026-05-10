import { Module } from '@nestjs/common';
import { EndUserAuthModule } from '../end-user-auth/end-user-auth.module.js';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module.js';
import { BankTransfersController } from './bank-transfers.controller.js';
import { BankTransfersService } from './bank-transfers.service.js';

@Module({
  imports: [EndUserAuthModule, BankAccountsModule],
  controllers: [BankTransfersController],
  providers: [BankTransfersService],
  exports: [BankTransfersService],
})
export class BankTransfersModule {}
