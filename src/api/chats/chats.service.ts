import { WebsocketGateway } from './../../websocket/websocket.gateway';
import { FilesService } from './../../files/files.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageSenderType, MessageType, Prisma, Role } from '@prisma/client';
import { CreateTextMessageDto } from './dto';

@Injectable()
export class ChatsService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    private ws: WebsocketGateway,
  ) {}

  getAllChatrooms() {
    return this.prisma.chatroom.findMany();
  }

  async getChatroomById(chatroomId: number) {
    try {
      return await this.prisma.chatroom.findUniqueOrThrow({
        where: {
          id: chatroomId,
        },
        include: {
          chatMessages: {
            skip: 0,
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No chatroom found');
      }
      throw error;
    }
  }

  async getCustomerChatroom(customerId: number) {
    try {
      return await this.prisma.chatroom.findUniqueOrThrow({
        where: {
          customerId,
        },
        include: {
          chatMessages: {
            skip: 0,
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException(
          'Customers do have not a chat room with Admin',
        );
      }
      throw error;
    }
  }

  async getRecentMessagesInChatroom(chatroomId: number, take = 10, skip = 0) {
    try {
      return await this.prisma.chatMessage.findMany({
        where: {
          chatroom: {
            id: chatroomId,
          },
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async getRecentMessagesOfCustomer(customerId: number, take = 10, skip = 0) {
    try {
      const chatroom = await this.getCustomerChatroom(customerId);
      return await this.getRecentMessagesInChatroom(chatroom.id, take, skip);
    } catch (error) {
      throw error;
    }
  }

  async adminGetRecentMessagesInChatroom(
    chatroomId: number,
    take = 10,
    skip = 0,
  ) {
    try {
      const chatroom = await this.prisma.chatroom.findUniqueOrThrow({
        where: { id: chatroomId },
      });

      return await this.getRecentMessagesInChatroom(chatroom.id, take, skip);
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No chatroom found');
      }
      throw error;
    }
  }

  async customerSendTextMessage(customerId: number, dto: CreateTextMessageDto) {
    try {
      const newMessage = await this.prisma.user
        .update({
          where: { id: customerId },
          data: {
            chatRoom: {
              upsert: {
                create: {
                  chatMessages: {
                    create: {
                      senderType: MessageSenderType.Customer,
                      type: MessageType.Text,
                      content: dto.content,
                    },
                  },
                },
                update: {
                  chatMessages: {
                    create: {
                      senderType: MessageSenderType.Customer,
                      type: MessageType.Text,
                      content: dto.content,
                    },
                  },
                },
              },
            },
          },
          select: {
            chatRoom: {
              select: {
                chatMessages: {
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        })
        .then((user) => user.chatRoom.chatMessages[0]);

      const adminWsChannels = await this.prisma.user
        .findMany({
          where: { role: Role.Admin },
          select: { id: true },
        })
        .then((users) =>
          users.map((user) => `socket-channel-for-user-${user.id}`),
        );

      this.ws.serverSendEvent('newMessage', newMessage, adminWsChannels);

      return newMessage;
    } catch (error) {
      throw error;
    }
  }

  async customerSendFileMessage(customerId: number, file: Express.Multer.File) {
    try {
      let chatroom = await this.prisma.chatroom.findUnique({
        where: { customerId },
      });

      if (!chatroom) {
        chatroom = await this.prisma.chatroom.create({
          data: {
            customerId,
          },
        });
      }

      let messageType: MessageType;
      if (/^image\/.+$/.test(file.mimetype)) messageType = MessageType.Image;
      else if (/^audio\/.+$/.test(file.mimetype))
        messageType = MessageType.Audio;
      else if (/^video\/.+$/.test(file.mimetype))
        messageType = MessageType.Video;
      else messageType = MessageType.File;

      const uploadedFile = await this.filesService.sendFileMessage(
        chatroom.id,
        file,
      );

      const newMessage = await this.prisma.chatroom
        .update({
          where: { id: chatroom.id },
          data: {
            chatMessages: {
              create: {
                senderType: MessageSenderType.Customer,
                type: messageType,
                content: file.originalname,
                attachment: uploadedFile.url,
              },
            },
          },
          select: {
            chatMessages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        })
        .then((chatroom) => chatroom.chatMessages[0]);

      const adminWsChannels = await this.prisma.user
        .findMany({
          where: { role: Role.Admin },
          select: { id: true },
        })
        .then((users) =>
          users.map((user) => `socket-channel-for-user-${user.id}`),
        );

      this.ws.serverSendEvent('newMessage', newMessage, adminWsChannels);

      return newMessage;
    } catch (error) {
      throw error;
    }
  }

  async adminSendTextMessage(chatroomId: number, dto: CreateTextMessageDto) {
    try {
      const chatroom = await this.prisma.chatroom.findUniqueOrThrow({
        where: { id: chatroomId },
      });

      const newMessage = await this.prisma.chatroom
        .update({
          where: { id: chatroom.id },
          data: {
            chatMessages: {
              create: {
                senderType: MessageSenderType.Admin,
                type: MessageType.Text,
                content: dto.content,
              },
            },
          },
          select: {
            chatMessages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        })
        .then((chatroom) => chatroom.chatMessages[0]);

      this.ws.serverSendEvent('newMessage', newMessage, [
        `socket-channel-for-user-${chatroom.customerId}`,
      ]);

      return newMessage;
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No chatroom found');
      }
      throw error;
    }
  }

  async adminSendFileMessage(chatroomId: number, file: Express.Multer.File) {
    try {
      const chatroom = await this.prisma.chatroom.findUniqueOrThrow({
        where: { id: chatroomId },
      });

      let messageType: MessageType;
      if (/^image\/.+$/.test(file.mimetype)) messageType = MessageType.Image;
      else if (/^audio\/.+$/.test(file.mimetype))
        messageType = MessageType.Audio;
      else if (/^video\/.+$/.test(file.mimetype))
        messageType = MessageType.Video;
      else messageType = MessageType.File;

      const uploadedFile = await this.filesService.sendFileMessage(
        chatroom.id,
        file,
      );

      const newMessage = await this.prisma.chatroom
        .update({
          where: { id: chatroom.id },
          data: {
            chatMessages: {
              create: {
                senderType: MessageSenderType.Admin,
                type: messageType,
                content: file.originalname,
                attachment: uploadedFile.url,
              },
            },
          },
          select: {
            chatMessages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        })
        .then((chatroom) => chatroom.chatMessages[0]);

      this.ws.serverSendEvent('newMessage', newMessage, [
        `socket-channel-for-user-${chatroom.customerId}`,
      ]);

      return newMessage;
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No chatroom found');
      }
      throw error;
    }
  }

  async adminCreateConversation(customerId: number) {
    try {
      return await this.prisma.chatroom.create({
        data: { customerId },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            `Chatroom with customer #${customerId} already exists`,
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Customer does not exist');
        }
      }
      throw error;
    }
  }
}
