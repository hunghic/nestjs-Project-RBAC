import {
  CreateFileMessageDto,
  CreateTextMessageDto,
  GetRecentMessagesDto,
} from './dto';
import { User } from '@prisma/client';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserInRequest } from '../../common/decorators';
import { ChatsService } from './chats.service';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Chats')
@ApiBearerAuth()
@Controller('chats')
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Get()
  getChatroomWithAdmin(@UserInRequest() user: User) {
    return this.chatsService.getCustomerChatroom(user.id);
  }

  @Get('recent-messages')
  getRecentMessages(
    @Query() query: GetRecentMessagesDto,
    @UserInRequest() user: User,
  ) {
    return this.chatsService.getRecentMessagesOfCustomer(
      user.id,
      query.take,
      query.skip,
    );
  }

  @Post('send/text-message')
  sendTextMessageToAdmin(
    @UserInRequest() user: User,
    @Body() body: CreateTextMessageDto,
  ) {
    return this.chatsService.customerSendTextMessage(user.id, body);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File message',
    type: CreateFileMessageDto,
  })
  @Post('send/file-message')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 /* 100MB */ },
    }),
  )
  sendFileMessage(
    @UserInRequest() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.chatsService.customerSendFileMessage(user.id, file);
  }
}
