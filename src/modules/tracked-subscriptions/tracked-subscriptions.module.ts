import { Module } from '@nestjs/common';
import { TrackedSubscriptionsController } from './tracked-subscriptions.controller.js';
import { TrackedSubscriptionsService } from './tracked-subscriptions.service.js';

@Module({
  controllers: [TrackedSubscriptionsController],
  providers: [TrackedSubscriptionsService],
  exports: [TrackedSubscriptionsService],
})
export class TrackedSubscriptionsModule {}
