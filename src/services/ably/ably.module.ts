import { Global, Module } from '@nestjs/common';
import { AblyService } from './ably.service.js';

@Global()
@Module({
  providers: [AblyService],
  exports: [AblyService],
})
export class AblyModule {}
