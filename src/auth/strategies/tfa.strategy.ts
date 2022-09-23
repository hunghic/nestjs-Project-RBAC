import { verifyDataArgon } from './../../common/helper/argon';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class TFAStrategy extends PassportStrategy(Strategy, 'tfa-jwt') {
  constructor(private config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('ACCESS_TOKEN_SECRET_KEY'),
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: {
      sub: number;
      email: string;
      tfaEnabled: boolean;
      tfaVerified?: boolean;
    },
  ) {
    const accessToken = req?.get('authorization')?.split(' ')[1];
    // console.log(payload);
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
      });

      if (!user) throw new UnauthorizedException('User does not exist');

      if (!user.accessToken) {
        throw new UnauthorizedException('Access Token no longer available');
      }

      const isATValid = await verifyDataArgon(user.accessToken, accessToken);

      if (!isATValid) {
        throw new UnauthorizedException('Access Token no longer available');
      }

      if (!user.tfaEnabled)
        throw new ForbiddenException(
          'Your account has not been anabled for 2-factor authentication',
        );

      return user;
    } catch (error) {
      throw error;
    }
  }
}
