import { Module } from '@nestjs/common';
import { GmailAccountsController } from './gmail-accounts.controller.js';
import { GmailAccountsService } from './gmail-accounts.service.js';

@Module({
  controllers: [GmailAccountsController],
  providers: [GmailAccountsService],
  exports: [GmailAccountsService],
})
export class GmailAccountsModule {}
