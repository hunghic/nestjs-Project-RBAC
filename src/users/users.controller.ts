import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  PublicRoute,
  RequirePermissions,
  RequireRole,
  UserInRequest,
} from '../common/decorators';
import {
  ChangePasswordDto,
  ForgotPasawordDto,
  GetListUsersDto,
  ResetPasswordDto,
  AvatarUploadDto,
} from './dto';
import { Action } from '../common/types';
import { Role, User } from '@prisma/client';
import { PermissionsGuard, RoleGuard } from '../common/guards';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileFilter } from '../common/helper/multer';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth()
  @Get('profile')
  getUserProfile(@UserInRequest() user: User) {
    return this.usersService.getUserProfile(user.id);
  }

  @ApiBearerAuth()
  @Get()
  @UseGuards(RoleGuard) // RBAC authorization
  @RequireRole(Role.Admin)
  getListUsers(@Query() query: GetListUsersDto) {
    return this.usersService.getListUsers(query);
  }

  @Get('welcome')
  @PublicRoute()
  welcomeUser() {
    return 'Chào mừng tới Nest Shop!';
  }

  @ApiBearerAuth()
  @Patch('profile')
  @UseGuards(PermissionsGuard) // CBAC authorization
  @RequirePermissions({ action: Action.Update, subject: 'User' })
  updateUserProfile(@UserInRequest() user: User) {
    return this.usersService.updateUserProfile(user.id);
  }

  @ApiBearerAuth()
  @Patch('profile/username')
  @UseGuards(PermissionsGuard) // CBAC authorization
  @RequirePermissions({
    action: Action.Update,
    subject: 'User',
    field: 'username',
  })
  updateUserName(@UserInRequest() user: User) {
    return this.usersService.updateUserName(user.id);
  }

  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Avatar image',
    type: AvatarUploadDto,
  })
  @Patch('profile/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 20 * 1024 * 1024 /* 20MB */ },
      fileFilter: imageFileFilter,
    }),
  )
  async updateUserAvatar(
    @UserInRequest() user: User,
    @UploadedFile() avatar: Express.Multer.File,
    @Req() req: any,
  ) {
    try {
      if (req.fileValidationError)
        throw new BadRequestException(req.fileValidationError.message);
      return this.usersService.updateUserAvatar(user.id, avatar);
    } catch (error) {
      throw error;
    }
  }

  @ApiBearerAuth()
  @Delete(':userId/block')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: Action.Manage, subject: 'User' })
  blockUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.usersService.blockUser(userId);
  }

  @Post('forgot-password')
  @PublicRoute()
  async forgotPassword(@Body() body: ForgotPasawordDto) {
    try {
      await this.usersService.forgotPassword(body.email);

      return {
        message: "Please reset your password in 10' via the email you received",
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch('reset-password')
  @PublicRoute()
  async resetPassword(@Body() body: ResetPasswordDto) {
    try {
      const { password, token } = body;

      const result = await this.usersService.resetPassword(password, token);

      return result;
    } catch (error) {
      throw error;
    }
  }

  @ApiBearerAuth()
  @Patch('change-password')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({
    action: Action.Update,
    subject: 'User',
    field: 'password',
  })
  async changePassword(
    @UserInRequest() user: User,
    @Body() body: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user, body);
  }
}
