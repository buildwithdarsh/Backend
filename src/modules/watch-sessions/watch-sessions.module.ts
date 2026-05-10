import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module.js';
import { WatchSessionsController } from './watch-sessions.controller.js';
import { WatchSessionsService } from './watch-sessions.service.js';

@Module({
  imports: [
    WalletModule,
  ],
  controllers: [WatchSessionsController],
  providers: [WatchSessionsService],
  exports: [WatchSessionsService],
})
export class WatchSessionsModule {}
