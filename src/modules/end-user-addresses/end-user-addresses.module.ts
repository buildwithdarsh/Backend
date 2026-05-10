import { Module } from '@nestjs/common';
import { EndUserAddressesService } from './end-user-addresses.service.js';
import { EndUserAddressesController } from './end-user-addresses.controller.js';

@Module({
  controllers: [EndUserAddressesController],
  providers: [EndUserAddressesService],
  exports: [EndUserAddressesService],
})
export class EndUserAddressesModule {}
