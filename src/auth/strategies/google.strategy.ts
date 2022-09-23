import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private config: ConfigService) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID'),
      clientSecret: config.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.get('GOOGLE_REDIRECT_URL'),
      scope: ['profile'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: any): any {
    try {
      const { sub, name, picture } = profile._json;
      return {
        googleId: sub,
        googleName: name,
        googleAvatar: picture,
      };
    } catch (error) {
      throw error;
    }
  }
}
