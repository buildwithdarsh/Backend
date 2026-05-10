import { Module } from '@nestjs/common';
import { CronController } from './cron.controller.js';
import { JobsModule } from '../../jobs/jobs.module.js';

@Module({
  imports: [JobsModule],
  controllers: [CronController],
})
export class CronModule {}
