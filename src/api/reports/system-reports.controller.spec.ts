import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { SystemReportsController } from './system-reports.controller';

describe('SystemReportsController', () => {
  let controller: SystemReportsController;

  // Mocking dependencies
  const mockReportsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
      ],
    }).compile();

    controller = module.get<SystemReportsController>(SystemReportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
