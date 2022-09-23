import { verifyAccessToken } from '../../common/helper/jwt';
import { IoAdapter } from '@nestjs/platform-socket.io';

export class CustomIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any) {
    const server = super.createIOServer(port, options);
    server.use(async (socket, next) => {
      try {
        const accessToken = socket.handshake.auth.accessToken;
        if (!accessToken) return next();
        const payload = verifyAccessToken(accessToken);
        const userId = payload.sub;
        socket.userId = userId;
        socket.emit('authentication', {
          success: true,
          message: `Socket authenticated user ${userId}`,
        });
      } catch (error) {
        socket.emit('authentication', {
          success: false,
          message: error.message,
        });
      } finally {
        next();
      }
    });
    return server;
  }
}
