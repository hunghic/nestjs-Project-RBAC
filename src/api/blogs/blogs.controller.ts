import { BlogsService } from './blogs.service';
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Blogs')
@ApiBearerAuth()
@Controller('blogs')
export class BlogsController {
  constructor(private blogsService: BlogsService) {}

  @Get()
  getListBlogs() {
    return this.blogsService.getListBlogs();
  }

  @Get(':id')
  getBlogById(@Param('id', ParseIntPipe) blogId: number) {
    return this.blogsService.getBlogById(blogId);
  }
}
