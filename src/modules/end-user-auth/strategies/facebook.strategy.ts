import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get('FACEBOOK_APP_ID', ''),
      clientSecret: configService.get('FACEBOOK_APP_SECRET', ''),
      callbackURL: configService.get('FACEBOOK_CALLBACK_URL', '/api/v1/storefront/auth/facebook/callback'),
      scope: ['email'],
      profileFields: ['emails', 'name', 'photos'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    const { emails, name, photos, id } = profile;
    const user = {
      facebookId: id,
      email: emails?.[0]?.value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      picture: photos?.[0]?.value,
    };
    done(null, user);
  }
}
