import { Module } from '@nestjs/common';
import { EndUsersController } from './end-users.controller.js';
import { EndUsersService } from './end-users.service.js';

@Module({
  controllers: [EndUsersController],
  providers: [EndUsersService],
  exports: [EndUsersService],
})
export class EndUsersModule {}
