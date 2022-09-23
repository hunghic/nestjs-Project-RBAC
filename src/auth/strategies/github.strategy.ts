import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private config: ConfigService) {
    super({
      clientID: config.get('GITHUB_CLIENT_ID'),
      clientSecret: config.get('GITHUB_CLIENT_SECRET'),
      callbackURL: config.get('GITHUB_REDIRECT_URL'),
      scope: [],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: any): any {
    try {
      const { id, name, avatar_url } = profile._json;
      return {
        githubId: id.toString(),
        githubName: name,
        githubAvatar: avatar_url,
      };
    } catch (error) {
      throw error;
    }
  }
}
