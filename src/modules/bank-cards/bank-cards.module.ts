import { Module } from '@nestjs/common';
import { EndUserAuthModule } from '../end-user-auth/end-user-auth.module.js';
import { BankCardsController } from './bank-cards.controller.js';
import { BankCardsService } from './bank-cards.service.js';

@Module({
  imports: [EndUserAuthModule],
  controllers: [BankCardsController],
  providers: [BankCardsService],
  exports: [BankCardsService],
})
export class BankCardsModule {}
