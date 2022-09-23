import { NotificationsService } from './notifications.service';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  CreateGeneralNotificationDto,
  CreateSpecificNotificationDto,
} from './dto';
import { RequireRole, UserInRequest } from '../common/decorators';
import { Role, User } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleGuard } from '../common/guards';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(RoleGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  getUserNotifications(@UserInRequest() user: User) {
    return this.notificationsService.getUserNotifications(user.id);
  }

  @RequireRole(Role.Admin)
  @Post('general')
  createGeneralNotification(@Body() body: CreateGeneralNotificationDto) {
    return this.notificationsService.createGeneralNotification(body);
  }

  @RequireRole(Role.Admin)
  @Post('specific')
  createSpecifigNotification(@Body() body: CreateSpecificNotificationDto) {
    return this.notificationsService.createSpecificNotification(body);
  }
}
