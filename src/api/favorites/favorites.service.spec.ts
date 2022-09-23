import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseDatabaseService } from '../../common/external-services/firebase-admin/firebase-database.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;

  // Mocking dependencies
  const mockPrismaService = {};

  const mockFirebaseDbService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
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

    service = module.get<FavoritesService>(FavoritesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
