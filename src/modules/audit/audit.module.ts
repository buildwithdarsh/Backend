import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditController, AdminAuditController } from './audit.controller.js';
import { AuditService } from './audit.service.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuditController, AdminAuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
