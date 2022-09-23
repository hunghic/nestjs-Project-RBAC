import { ShoppingCartsService } from './shopping-carts.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingCartsController } from './shopping-carts.controller';

describe('ShoppingCartsController', () => {
  let controller: ShoppingCartsController;

  // Mocking dependencies
  const mockCartsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShoppingCartsController],
      providers: [
        {
          provide: ShoppingCartsService,
          useValue: mockCartsService,
        },
      ],
    }).compile();

    controller = module.get<ShoppingCartsController>(ShoppingCartsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
