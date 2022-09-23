import { AdminBlogsController } from './admin-blogs.controller';
import { Module } from '@nestjs/common';
import { FilesModule } from '../../files/files.module';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';

@Module({
  imports: [FilesModule],
  controllers: [BlogsController, AdminBlogsController],
  providers: [BlogsService],
})
export class BlogsModule {}
