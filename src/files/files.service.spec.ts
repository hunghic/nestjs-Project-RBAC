import { Test, TestingModule } from '@nestjs/testing';
import { AwsS3Service } from '../common/external-services/aws-s3/aws-s3.service';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from './files.service';

describe('FilesService', () => {
  let service: FilesService;

  // Mocking Dependencies
  const mockPrismaService = {};
  const mockAwsS3Service = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AwsS3Service,
          useValue: mockAwsS3Service,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
