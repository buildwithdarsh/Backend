import { Module } from '@nestjs/common';
import { ConnectedSourcesController } from './connected-sources.controller.js';
import { ConnectedSourcesService } from './connected-sources.service.js';

@Module({
  controllers: [ConnectedSourcesController],
  providers: [ConnectedSourcesService],
  exports: [ConnectedSourcesService],
})
export class ConnectedSourcesModule {}
