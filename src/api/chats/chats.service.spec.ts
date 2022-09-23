import { WebsocketGateway } from './../../websocket/websocket.gateway';
import { FilesService } from './../../files/files.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatsService } from './chats.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ChatsService', () => {
  let service: ChatsService;

  // Mocking dependencies
  const mockPrismaService = {};

  const mockFilesService = {};

  const mockWsGateway = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
        {
          provide: WebsocketGateway,
          useValue: mockWsGateway,
        },
      ],
    }).compile();

    service = module.get<ChatsService>(ChatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
