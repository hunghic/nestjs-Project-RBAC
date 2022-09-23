import { NotificationsService } from './../../notifications/notifications.service';
import { VnpayService } from './../../common/external-services/vnpay/vnpay.service';
import { AddressesService } from './../addresses/addresses.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;

  // Mocking dependencies
  const mockPrismaService = {};

  const mockAddressesService = {};

  const mockVnpayService = {};

  const mocknotiService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AddressesService,
          useValue: mockAddressesService,
        },
        {
          provide: VnpayService,
          useValue: mockVnpayService,
        },
        {
          provide: NotificationsService,
          useValue: mocknotiService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
