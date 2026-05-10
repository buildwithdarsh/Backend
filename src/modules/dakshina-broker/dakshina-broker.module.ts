import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module.js';
import { DakshinaBrokerController } from './dakshina-broker.controller.js';
import { DakshinaBrokerService } from './dakshina-broker.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [DakshinaBrokerController],
  providers: [DakshinaBrokerService],
  exports: [DakshinaBrokerService],
})
export class DakshinaBrokerModule {}
