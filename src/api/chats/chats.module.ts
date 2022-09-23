import { WebsocketModule } from './../../websocket/websocket.module';
import { AdminChatsController } from './admin-chats.controller';
import { FilesModule } from './../../files/files.module';
import { Module } from '@nestjs/common';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';

@Module({
  imports: [FilesModule, WebsocketModule],
  controllers: [ChatsController, AdminChatsController],
  providers: [ChatsService],
})
export class ChatsModule {}
