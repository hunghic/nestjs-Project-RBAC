import { FirebaseDatabaseService } from './../../common/external-services/firebase-admin/firebase-database.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ShoppingCartsService } from './shopping-carts.service';

describe('ShoppingCartsService', () => {
  let service: ShoppingCartsService;

  // Mocking dependencies
  const mockPrismaService = {};

  const mockFirebaseDbService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoppingCartsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FirebaseDatabaseService,
          useValue: mockFirebaseDbService,
        },
      ],
    }).compile();

    service = module.get<ShoppingCartsService>(ShoppingCartsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
