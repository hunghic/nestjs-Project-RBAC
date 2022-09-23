import { FilesService } from '../files/files.service';
import { verifyResetPasswordToken } from './../common/helper/jwt';
import { MailService } from './../notifications/mail/mail.service';
import { PrismaService } from './../prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { ChangePasswordDto, GetListUsersDto } from './dto';
import { compareData, hashData } from '../common/helper/bcrypt';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private mailService: MailService,
    private filesService: FilesService,
  ) {}

  private _getUserBasicDetail(user: User): any {
    delete user.password;
    delete user.accessToken;
    delete user.refreshToken;
    delete user.tfaSecret;

    return user;
  }

  async getUserProfile(userId: number): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          currentAvatar: {
            select: {
              file: true,
            },
          },
        },
      });

      if (!user) throw new NotFoundException();

      return this._getUserBasicDetail(user);
    } catch (error) {
      throw error;
    }
  }

  async getListUsers({ skip, take, keyword }: GetListUsersDto): Promise<any> {
    return {
      skip,
      take,
      keyword,
      message:
        'Đây là endpoint lấy danh sách user theo keyword, chỉ Admin được thực hiện',
    };
  }

  async updateUserProfile(userId: number): Promise<any> {
    return {
      message: `Endpoint update user có id là ${userId}`,
    };
  }

  async updateUserName(userId: number): Promise<any> {
    return {
      message: `Endpoint update username của user có id là ${userId}`,
    };
  }

  async updateUserAvatar(
    userId: number,
    avatar: Express.Multer.File,
  ): Promise<any> {
    try {
      const newAvatar = await this.filesService.uploadUserAvatar(
        userId,
        avatar,
      );
      const updatedUser = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          currentAvatarId: newAvatar.id,
        },
        select: {
          currentAvatar: {
            select: {
              file: true,
            },
          },
        },
      });

      return {
        message: 'Update avatar successfully',
        avatarUrl: updatedUser.currentAvatar.file.url,
      };
    } catch (error) {
      throw error;
    }
  }

  async blockUser(userId: number): Promise<any> {
    return {
      message: `Endpoint block user có id là ${userId}, chỉ Admin có quyền Manage thực hiện`,
    };
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) throw new BadRequestException('Email does not exist');

      if (!user.accountVerified)
        throw new ForbiddenException('Account is not verified');

      this.mailService.forgotPassword(user);

      return;
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(password: string, token: string): Promise<any> {
    try {
      const payload = verifyResetPasswordToken(token);

      const user: User = await this.prisma.user.findUnique({
        where: {
          id: payload.userId,
        },
      });

      if (!user) throw new UnauthorizedException('Invalid account!');

      const newPassword = hashData(password);

      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: newPassword,
        },
      });

      return {
        message:
          'Reset password successfully, you can already login to your acocunt with new password',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      } else {
        throw new ForbiddenException(error.message || 'Cannot reset password');
      }
    }
  }

  async changePassword(
    user: User,
    { currentPassword, newPassword }: ChangePasswordDto,
  ): Promise<any> {
    try {
      if (!compareData(currentPassword, user.password))
        throw new UnauthorizedException('Current password is not correct');

      if (currentPassword === newPassword)
        throw new BadRequestException(
          'The new password must not be the same as the old password',
        );

      const hasPassword = hashData(newPassword);

      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: hasPassword,
        },
      });

      const tokens = await this.authService.loginWithUserId({
        id: user.id,
        password: newPassword,
      });

      return {
        message: 'Change password successfully',
        ...tokens,
      };
    } catch (error) {
      throw error;
    }
  }
}
