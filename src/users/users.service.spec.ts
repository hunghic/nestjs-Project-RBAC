import { FilesService } from './../files/files.service';
import { GetListUsersDto } from './dto/get-list-users.dto';
import { MailService } from './../notifications/mail/mail.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from '@prisma/client';
import * as jwt from './../common/helper/jwt';
import * as bcrypt from '../common/helper/bcrypt';

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;

  // Mocking data
  const users: User[] = [
    {
      id: 24,
      createdAt: new Date(),
      updatedAt: new Date(),
      email: 'example1@gmail.com',
      username: null,
      password: 'password1',
      googleId: null,
      githubId: null,
      accountType: 'NormalAccount',
      accountVerified: true,
      accessToken: '',
      refreshToken: '',
      fullname: 'Frank Khiêm',
      role: 'User',
      tfaEnabled: true,
      tfaSecret: '',
      currentAvatarId: null,
    },
    {
      id: 26,
      createdAt: new Date(),
      updatedAt: new Date(),
      email: 'example2@gmail.com',
      username: null,
      password: 'password2',
      googleId: null,
      githubId: null,
      accountType: 'NormalAccount',
      accountVerified: false,
      accessToken: '',
      refreshToken: '',
      fullname: 'Mei Tea',
      role: 'User',
      tfaEnabled: true,
      tfaSecret: '',
      currentAvatarId: null,
    },
  ];

  // Mocking Dependencies
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(
        (query: { where: { id?: number; email?: string } }) => {
          const id = query.where.id;
          const email = query.where.email;
          return Promise.resolve(
            users.find((user) => {
              if (id && email) return user.id === id && user.email === email;
              if (id) return user.id === id;
              if (email) return user.email === email;
              return false;
            }),
          );
        },
      ),
      update: jest.fn(() => {
        return;
      }),
    },
  };
  const mockAuthService = {
    loginWithUserId: jest.fn().mockResolvedValue({
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    }),
  };
  const mockMailService = {
    forgotPassword: jest.fn(),
  };
  const mockFilesService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserProfile unit testing', () => {
    it('should take user profile', async () => {
      const userProfile = await service.getUserProfile(users[0].id);
      // console.log(userProfile);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalled();
      expect(userProfile.id).toEqual(users[0].id);
      expect(userProfile.fullname).toEqual(users[0].fullname);
    });

    it('should take notfound error when userId does not exist', async () => {
      await expect(service.getUserProfile(-1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getListUsers unit testing', () => {
    it('should take a list of users', async () => {
      const dto: GetListUsersDto = {
        skip: 10,
        take: 20,
      };
      const result = await service.getListUsers(dto);
      expect(result).toEqual({
        skip: dto.skip,
        take: dto.take,
        keyword: dto.keyword,
        message:
          'Đây là endpoint lấy danh sách user theo keyword, chỉ Admin được thực hiện',
      });
    });
  });

  describe('updateUserProfile unit testing', () => {
    it('should take userId in message', async () => {
      const userId = users[0].id;
      await expect(service.updateUserProfile(userId)).resolves.toEqual({
        message: `Endpoint update user có id là ${userId}`,
      });
    });
  });

  describe('updateUserName unit testing', () => {
    it('should take userId in message', async () => {
      const userId = users[0].id;
      await expect(service.updateUserName(userId)).resolves.toEqual({
        message: `Endpoint update username của user có id là ${userId}`,
      });
    });
  });

  describe('blockUser unit testing', () => {
    it('should take userId in message', async () => {
      const userId = users[0].id;
      await expect(service.blockUser(userId)).resolves.toEqual({
        message: `Endpoint block user có id là ${userId}, chỉ Admin có quyền Manage thực hiện`,
      });
    });
  });

  describe('forgotPassword unit testing', () => {
    it('should send mail with Token reset password to user', async () => {
      const email = 'example1@gmail.com';
      await expect(service.forgotPassword(email)).resolves.toBeUndefined();
    });

    it('should take error if email does not exist', async () => {
      const email = 'error@gmail.com';
      await expect(service.forgotPassword(email)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should take error if user not verified account', async () => {
      const email = 'example2@gmail.com';
      await expect(service.forgotPassword(email)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('resetPassword unit testing', () => {
    it('should reset user password', async () => {
      jest.spyOn(jwt, 'verifyResetPasswordToken').mockImplementation(() => {
        return {
          userId: users[0].id,
        };
      });
      const result = await service.resetPassword('newPassword', 'resetToken');
      expect(result).toEqual({
        message:
          'Reset password successfully, you can already login to your acocunt with new password',
      });
    });

    it('should throw an unauthorized error', async () => {
      jest.spyOn(jwt, 'verifyResetPasswordToken').mockImplementation(() => {
        return {
          userId: -1,
        };
      });
      await expect(
        service.resetPassword('newPassword', 'resetToken'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw an forbidden error', async () => {
      jest.spyOn(jwt, 'verifyResetPasswordToken').mockImplementation(() => {
        throw new Error();
      });

      await expect(
        service.resetPassword('newPassword', 'resetToken'),
      ).rejects.toThrow(new ForbiddenException('Cannot reset password'));
    });
  });

  describe('changePassword unit testing', () => {
    const user = users[0];
    jest
      .spyOn(bcrypt, 'compareData')
      .mockImplementation((plain, hash) => plain === hash);

    it('should change user password and take new tokens', async () => {
      await expect(
        service.changePassword(user, {
          currentPassword: user.password,
          newPassword: 'new password',
        }),
      ).resolves.toEqual({
        message: 'Change password successfully',
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('should take error if current passwort is invalid', async () => {
      await expect(
        service.changePassword(user, {
          currentPassword: 'wrong password',
          newPassword: user.password,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should take error if new password same as current passwort', async () => {
      await expect(
        service.changePassword(user, {
          currentPassword: user.password,
          newPassword: user.password,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
