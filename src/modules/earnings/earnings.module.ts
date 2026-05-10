import { Module } from '@nestjs/common';
import { EarningsController } from './earnings.controller.js';
import { EarningsService } from './earnings.service.js';

@Module({
  controllers: [EarningsController],
  providers: [EarningsService],
  exports: [EarningsService],
})
export class EarningsModule {}
