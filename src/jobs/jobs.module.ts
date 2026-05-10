import { Module } from '@nestjs/common';
import { WatchSessionsModule } from '../modules/watch-sessions/watch-sessions.module.js';
import { WorkersModule } from '../workers/workers.module.js';
import { CampaignSchedulerJob } from './campaign-scheduler.job.js';
import { SegmentRefreshJob } from './segment-refresh.job.js';
import { UsageAggregatorJob } from './usage-aggregator.job.js';
import { PlanExpiryJob } from './plan-expiry.job.js';
import { StaleSessionCleanupJob } from './stale-session-cleanup.job.js';
import { StaleRoomCleanupJob } from './stale-room-cleanup.job.js';
import { MarketplaceFakeDataJob } from './marketplace-fake-data.job.js';

@Module({
  imports: [
    WatchSessionsModule,
    WorkersModule,
  ],
  providers: [
    CampaignSchedulerJob,
    SegmentRefreshJob,
    UsageAggregatorJob,
    PlanExpiryJob,
    StaleSessionCleanupJob,
    StaleRoomCleanupJob,
    MarketplaceFakeDataJob,
  ],
  exports: [MarketplaceFakeDataJob],
})
export class JobsModule {}
