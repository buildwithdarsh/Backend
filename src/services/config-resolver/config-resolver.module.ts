import { Global, Module } from '@nestjs/common';
import { ConfigResolverService } from './config-resolver.service.js';

@Global()
@Module({
  providers: [ConfigResolverService],
  exports: [ConfigResolverService],
})
export class ConfigResolverModule {}
