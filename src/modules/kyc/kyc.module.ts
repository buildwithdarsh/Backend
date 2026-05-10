import { Module } from '@nestjs/common';
import { EndUserAuthModule } from '../end-user-auth/end-user-auth.module.js';
import { KycController } from './kyc.controller.js';
import { KycService } from './kyc.service.js';

@Module({
  imports: [EndUserAuthModule],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
