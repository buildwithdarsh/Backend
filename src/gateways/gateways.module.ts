import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway.js';

@Module({
  imports: [JwtModule],
  providers: [NotificationsGateway],
  exports: [NotificationsGateway],
})
export class GatewaysModule {}
