import { Module } from '@nestjs/common';
import { WorkersModule } from '../../workers/workers.module.js';
import { CampaignsService } from './campaigns.service.js';
import { CampaignsController } from './campaigns.controller.js';

@Module({
  imports: [
    WorkersModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
