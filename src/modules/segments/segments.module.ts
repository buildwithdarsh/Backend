import { Module } from '@nestjs/common';
import { SegmentsController } from './segments.controller.js';
import { SegmentsService } from './segments.service.js';

@Module({
  controllers: [SegmentsController],
  providers: [SegmentsService],
  exports: [SegmentsService],
})
export class SegmentsModule {}
