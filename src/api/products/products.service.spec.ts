import { FILE_QUEUE } from './../../common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from '../../files/files.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FavoritesService } from '../favorites/favorites.service';
import { ShoppingCartsService } from '../shopping-carts/shopping-carts.service';
import { ProductsService } from './products.service';
import { getQueueToken } from '@nestjs/bull';

describe('ProductsService', () => {
  let service: ProductsService;

  // Mocking dependencies
  const mockPrismaService = {};

  const mockFilesService = {};

  const mockCartsService = {};

  const mockFavoritesService = {};

  const mockFileQueue = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
        {
          provide: ShoppingCartsService,
          useValue: mockCartsService,
        },
        {
          provide: FavoritesService,
          useValue: mockFavoritesService,
        },
        {
          provide: getQueueToken(FILE_QUEUE),
          useValue: mockFileQueue,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
