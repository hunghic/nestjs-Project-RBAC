import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { UserReportsController } from './user-reports.controller';

describe('UserReportsController', () => {
  let controller: UserReportsController;

  // Mocking dependencies
  const mockReportsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
      ],
    }).compile();

    controller = module.get<UserReportsController>(UserReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
