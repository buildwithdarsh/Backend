import { Module } from '@nestjs/common';
import { SubscriptionSuggestionsController } from './subscription-suggestions.controller.js';
import { SubscriptionSuggestionsService } from './subscription-suggestions.service.js';

@Module({
  controllers: [SubscriptionSuggestionsController],
  providers: [SubscriptionSuggestionsService],
  exports: [SubscriptionSuggestionsService],
})
export class SubscriptionSuggestionsModule {}
