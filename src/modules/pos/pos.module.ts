import { Module } from '@nestjs/common';
import { PosService } from './pos.service.js';
import { PosController } from './pos.controller.js';
import { PosProviderFactory } from './pos-provider.factory.js';
import { MockPosProvider } from './providers/mock.provider.js';

@Module({
  controllers: [PosController],
  providers: [PosService, PosProviderFactory, MockPosProvider],
  exports: [PosService],
})
export class PosModule {}
