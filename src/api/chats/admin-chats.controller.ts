import { RoleGuard } from '../../common/guards';
import { Role } from '@prisma/client';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { RequireRole } from 'src/common/decorators';
import { ChatsService } from './chats.service';
import {
  CreateFileMessageDto,
  CreateTextMessageDto,
  GetRecentMessagesDto,
} from './dto';

@ApiTags('Chats', 'Admin')
@ApiBearerAuth()
@Controller('admin/chats')
@UseGuards(RoleGuard)
@RequireRole(Role.Admin)
export class AdminChatsController {
  constructor(private chatsService: ChatsService) {}

  @Get()
  getAllChatroom() {
    return this.chatsService.getAllChatrooms();
  }

  @Get(':chatroomId')
  getChatroomById(@Param('chatroomId', ParseIntPipe) chatroomId: number) {
    return this.chatsService.getChatroomById(chatroomId);
  }

  @Get(':chatroomId/recent-messages')
  getRecentMessagesInChatroom(
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
    @Query() query: GetRecentMessagesDto,
  ) {
    return this.chatsService.adminGetRecentMessagesInChatroom(
      chatroomId,
      query.take,
      query.skip,
    );
  }

  @Post('customer/:customerId')
  createConversationWithCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
  ) {
    return this.chatsService.adminCreateConversation(customerId);
  }

  @Post(':chatroomId/send/text-message')
  sendTextMessageToChatroom(
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
    @Body() body: CreateTextMessageDto,
  ) {
    return this.chatsService.adminSendTextMessage(chatroomId, body);
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File message',
    type: CreateFileMessageDto,
  })
  @Post(':chatroomId/send/file-message')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 /* 100MB */ },
    }),
  )
  sendFileMessage(
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.chatsService.adminSendFileMessage(chatroomId, file);
  }
}
