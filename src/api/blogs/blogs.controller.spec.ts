import { BlogsService } from './blogs.service';
import { Test, TestingModule } from '@nestjs/testing';
import { BlogsController } from './blogs.controller';

describe('BlogsController', () => {
  let controller: BlogsController;

  // Mocking dependencies
  const mockBlogsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlogsController],
      providers: [
        {
          provide: BlogsService,
          useValue: mockBlogsService,
        },
      ],
    }).compile();

    controller = module.get<BlogsController>(BlogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
