import { CanActivate } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import { PermissionsGuard } from '../common/guards';
import {
  ChangePasswordDto,
  ForgotPasawordDto,
  GetListUsersDto,
  ResetPasswordDto,
} from './dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
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
      currentAvatarId: 1,
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
      currentAvatarId: 2,
    },
  ];

  // Mocking dependencies
  const mockUserService = {
    getUserProfile: jest.fn(),
    getListUsers: jest.fn(),
    updateUserProfile: jest.fn(),
    updateUserName: jest.fn(),
    blockUser: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
  };
  const mockPermissionsGuard: CanActivate = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue(mockPermissionsGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserProfile unit testing', () => {
    it('should have been called', async () => {
      await controller.getUserProfile(users[0]);
      expect(service.getUserProfile).toHaveBeenCalledWith(users[0].id);
    });
  });

  describe('getListUsers unit testing', () => {
    const dto: GetListUsersDto = {};
    it('should have been called', async () => {
      await controller.getListUsers(dto);
      expect(service.getListUsers).toHaveBeenCalledWith({
        skip: dto.skip,
        take: dto.take,
        keyword: dto.keyword,
      });
    });
  });

  describe('welcomeUser unit testing', () => {
    it('should have been called', async () => {
      expect(controller.welcomeUser()).toEqual(expect.any(String));
    });
  });

  describe('updateUserProfile unit testing', () => {
    it('should have been called', async () => {
      await controller.updateUserProfile(users[0]);
      expect(service.updateUserProfile).toHaveBeenCalledWith(users[0].id);
    });
  });

  describe('updateUserName unit testing', () => {
    it('should have been called', async () => {
      await controller.updateUserName(users[0]);
      expect(service.updateUserName).toHaveBeenCalledWith(users[0].id);
    });
  });

  describe('blockUser unit testing', () => {
    it('should have been called', async () => {
      await controller.blockUser(users[0].id);
      expect(service.blockUser).toHaveBeenCalledWith(users[0].id);
    });
  });

  describe('forgotPassword unit testing', () => {
    const dto: ForgotPasawordDto = { email: users[0].email };
    it('should take message successfully', async () => {
      await expect(controller.forgotPassword(dto)).resolves.toMatchObject({
        message: expect.any(String),
      });
    });

    it('should take a error', async () => {
      mockUserService.forgotPassword.mockRejectedValue(new Error());
      await expect(controller.forgotPassword(dto)).rejects.toThrowError();
    });
  });

  describe('resetPassword unit testing', () => {
    const dto: ResetPasswordDto = { password: 'password', token: 'token' };
    it('should have been called', async () => {
      await controller.resetPassword(dto);
      expect(service.resetPassword).toHaveBeenCalledWith(
        dto.password,
        dto.token,
      );
    });

    it('should take a error', async () => {
      mockUserService.resetPassword.mockRejectedValue(new Error());
      await expect(controller.resetPassword(dto)).rejects.toThrowError();
    });
  });

  describe('changePassword unit testing', () => {
    const dto: ChangePasswordDto = {
      currentPassword: 'currentPassword',
      newPassword: 'newPassword',
    };
    it('should have been called', async () => {
      await controller.changePassword(users[0], dto);
      expect(service.changePassword).toHaveBeenCalledWith(users[0], { ...dto });
    });
  });
});
