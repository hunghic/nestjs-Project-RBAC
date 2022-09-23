import { CreateBlogDto } from './dto';
import { BlogsService } from './blogs.service';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { RoleGuard } from 'src/common/guards';
import { RequireRole } from 'src/common/decorators';
import { Role } from '@prisma/client';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { imageFileFilter } from '../../common/helper/multer';

@ApiTags('Blogs', 'Admin')
@ApiBearerAuth()
@Controller('admin/blogs')
@UseGuards(RoleGuard)
@RequireRole(Role.Admin)
export class AdminBlogsController {
  constructor(private blogsService: BlogsService) {}

  @ApiConsumes('multipart/form-data')
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'attachments' }, { name: 'thumbnail', maxCount: 1 }],
      {
        limits: { fileSize: 20 * 1024 * 1024 /* 20MB */ },
        fileFilter: imageFileFilter,
      },
    ),
  )
  async createBlog(
    @Body() body: CreateBlogDto,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      attachments?: Express.Multer.File[];
    },
    @Req() req: any,
  ) {
    try {
      if (req.fileValidationError)
        throw new BadRequestException(req.fileValidationError.message);

      const thumbnail = files.thumbnail ? files.thumbnail[0] : undefined;
      const attachments = files.attachments;

      return this.blogsService.createBlog(body, thumbnail, attachments);
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  deleteBlog(@Param('id', ParseIntPipe) blogId: number) {
    return this.blogsService.deleteBlog(blogId);
  }
}
