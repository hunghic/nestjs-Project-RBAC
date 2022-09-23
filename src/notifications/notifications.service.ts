import { WebsocketGateway } from './../websocket/websocket.gateway';
import { PrismaService } from './../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  CreateGeneralNotificationDto,
  CreateSpecificNotificationDto,
} from './dto';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService, private ws: WebsocketGateway) {}

  async createGeneralNotification(dto: CreateGeneralNotificationDto) {
    try {
      const noti = await this.prisma.notification.create({
        data: {
          ...dto,
        },
      });

      this.ws.serverSendEvent('newNotification', noti);

      return noti;
    } catch (error) {
      throw error;
    }
  }

  async createSpecificNotification(dto: CreateSpecificNotificationDto) {
    try {
      const { userIds, ...dataCreate } = dto;

      const noti = await this.prisma.notification.create({
        data: {
          ...dataCreate,
          type: NotificationType.Specific,
        },
      });

      await this.prisma.notificationSpecific.createMany({
        data: userIds.map((id) => ({
          userId: id,
          notificationId: noti.id,
        })),
      });

      const rooms = userIds.map((id) => `socket-channel-for-user-${id}`);

      this.ws.serverSendEvent('newNotification', noti, rooms);

      return noti;
    } catch (error) {
      throw error;
    }
  }

  async getUserNotifications(userId: number) {
    try {
      return await this.prisma.notification.findMany({
        where: {
          OR: [
            {
              type: NotificationType.General,
            },
            {
              type: NotificationType.Specific,
              notificationOfUsers: {
                some: {
                  userId,
                },
              },
            },
          ],
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
