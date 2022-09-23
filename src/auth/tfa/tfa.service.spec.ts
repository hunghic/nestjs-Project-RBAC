import { MailService } from './../../notifications/mail/mail.service';
import { AuthService } from './../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TfaService } from './tfa.service';

describe('TfaService', () => {
  let service: TfaService;

  // Mocking dependencies
  const mockPrismaService = {};
  const mockAuthService = {};
  const mockMailService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TfaService,
        ConfigService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<TfaService>(TfaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
