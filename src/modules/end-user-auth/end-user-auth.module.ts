import { Module, type Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { OrgSettingsModule } from '../org-settings/org-settings.module.js';
import { LoyaltyModule } from '../loyalty/loyalty.module.js';
import { WorkersModule } from '../../workers/workers.module.js';
import { EndUserAuthService } from './end-user-auth.service.js';
import { EndUserAuthController } from './end-user-auth.controller.js';
import { EndUserJwtStrategy } from './strategies/enduser-jwt.strategy.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { FacebookStrategy } from './strategies/facebook.strategy.js';

// Only register OAuth strategies when credentials are configured
const oauthProviders: Provider[] = [];
if (process.env['GOOGLE_CLIENT_ID']) oauthProviders.push(GoogleStrategy);
if (process.env['FACEBOOK_APP_ID']) oauthProviders.push(FacebookStrategy);

@Module({
  imports: [
    PassportModule,
    OrgSettingsModule,
    LoyaltyModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        privateKey: configService.getOrThrow<string>('JWT_PRIVATE_KEY'),
        publicKey: configService.getOrThrow<string>('JWT_PUBLIC_KEY'),
        signOptions: {
          algorithm: 'RS256' as const,
          expiresIn: '1h',
        },
        verifyOptions: {
          algorithms: ['RS256' as const],
        },
      }),
    }),
    WorkersModule,
  ],
  controllers: [EndUserAuthController],
  providers: [EndUserAuthService, EndUserJwtStrategy, ...oauthProviders],
  exports: [EndUserAuthService],
})
export class EndUserAuthModule {}
