import { Module } from '@nestjs/common';
import { EndUserAuthModule } from '../end-user-auth/end-user-auth.module.js';
import { BankAccountsController } from './bank-accounts.controller.js';
import { BankAccountsService } from './bank-accounts.service.js';

@Module({
  imports: [EndUserAuthModule],
  controllers: [BankAccountsController],
  providers: [BankAccountsService],
  exports: [BankAccountsService],
})
export class BankAccountsModule {}
