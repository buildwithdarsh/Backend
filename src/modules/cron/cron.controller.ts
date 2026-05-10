import { Controller, Get, Logger } from '@nestjs/common';
import { Public } from '../../common/decorators/index.js';
import { MarketplaceFakeDataJob } from '../../jobs/marketplace-fake-data.job.js';

@Controller('api/v1/cron')
export class CronController {
  private readonly logger = new Logger(CronController.name);

  constructor(
    private readonly marketplaceFakeDataJob: MarketplaceFakeDataJob,
  ) {}

  @Get('marketplace-fake-data')
  @Public()
  async marketplaceFakeData() {
    this.logger.log('Cron triggered: marketplace-fake-data');
    await this.marketplaceFakeDataJob.handleCron();
    return { ok: true };
  }
}
