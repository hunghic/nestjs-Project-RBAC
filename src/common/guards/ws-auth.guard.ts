import { verifyAccessToken } from './../helper/jwt';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();

      const accessToken: string = client.handshake.auth.accessToken;

      console.log('abc');

      const payload = verifyAccessToken(accessToken);

      const userId = payload.sub;

      client.userId = userId;

      return true; // Any socket can be traversed, with or without userId
    } catch (error) {
      throw new WsException(error.message);
    }
  }
}
