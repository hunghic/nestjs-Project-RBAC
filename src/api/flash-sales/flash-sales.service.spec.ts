import { NotificationsService } from './../../notifications/notifications.service';
import { MailService } from './../../notifications/mail/mail.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { FlashSalesService } from './flash-sales.service';

describe('FlashSalesService', () => {
  let service: FlashSalesService;

  // Mocking dependencies
  const mockPrismaService = {};

  const mockSchedulerRegistry = {};

  const mockMailService = {};

  const mockNotiService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlashSalesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotiService,
        },
      ],
    }).compile();

    service = module.get<FlashSalesService>(FlashSalesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
