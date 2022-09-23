import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket & { userId?: number }) {
    // console.log(`Client ${client.id} connected`);
    if (client.userId) {
      client.join(`socket-channel-for-user-${client.userId}`);
    }
    // console.log(client.rooms);
  }

  serverSendEvent(event: string, data: any, rooms: string[] = []) {
    this.server.to(rooms).emit(event, data);
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any) {
    // console.log('Message:', payload);
    return `Server response at ${Date.now()}`;
  }
}
