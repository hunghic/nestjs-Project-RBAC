import { AddressesService } from './addresses.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AddressesController } from './addresses.controller';

describe('AddressesController', () => {
  let controller: AddressesController;

  // Mocking dependencies
  const mockAddressesService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [
        {
          provide: AddressesService,
          useValue: mockAddressesService,
        },
      ],
    }).compile();

    controller = module.get<AddressesController>(AddressesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
