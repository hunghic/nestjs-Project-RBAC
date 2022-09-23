import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FilesService } from '../../files/files.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBlogDto } from './dto';

@Injectable()
export class BlogsService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  uploadThumbnail(blogId: number, file: Express.Multer.File) {
    if (!file) return;
    return this.filesService.uploadBlogAttachment(blogId, file);
  }

  uploadAttachments(blogId: number, files: Express.Multer.File[]) {
    if (!files) return;
    return files.map((file) =>
      this.filesService.uploadBlogAttachment(blogId, file),
    );
  }

  async removeBlogsAttachments(id: number) {
    try {
      const { fileIds, fileKeys } = await this.prisma.blogAttachment
        .findMany({
          where: { blogId: id },
          select: {
            file: {
              select: { id: true, key: true },
            },
          },
        })
        .then((result) => ({
          fileIds: result.map((image) => image.file.id),
          fileKeys: result.map((image) => image.file.key),
        }));

      if (fileKeys.length) {
        await this.prisma.uploadedFile.deleteMany({
          where: {
            id: { in: fileIds },
            BlogAttachment: {
              blogId: id,
            },
          },
        });

        if (!(await this.filesService.removeMultipleFiles(fileKeys)))
          throw new InternalServerErrorException(
            'Remove blog attachment files in storage failed',
          );
      }

      return {
        message: `Successfully removed all attachments of blog #${id}`,
      };
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No blog found');
      if (error instanceof Prisma.PrismaClientKnownRequestError)
        throw new InternalServerErrorException();
      throw error;
    }
  }

  getListBlogs() {
    return this.prisma.blog.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        view: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getBlogById(id: number) {
    try {
      await this.prisma.blog.findUniqueOrThrow({
        where: { id },
      });

      return this.prisma.blog
        .update({
          where: { id },
          data: { view: { increment: 1 } },
          include: {
            tags: {
              select: { name: true },
            },
          },
        })
        .then((blog) => {
          const tags = blog.tags.map((tag) => tag.name);
          return {
            ...blog,
            tags,
          };
        });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No blog found');
      throw error;
    }
  }

  async createBlog(
    dto: CreateBlogDto,
    thumbnail: Express.Multer.File = undefined,
    attachments: Express.Multer.File[] = undefined,
  ) {
    try {
      let blog = await this.prisma.blog.create({
        data: {
          title: dto.title,
          description: dto.description,
          content: dto.content,
          tags: {
            connectOrCreate: dto.tags.map((tag) => ({
              where: { name: tag.toLowerCase() },
              create: { name: tag.toLowerCase() },
            })),
          },
        },
      });

      const arrayUploadAttachments = attachments?.length
        ? this.uploadAttachments(blog.id, attachments)
        : [];

      const [blogThumbnail, ...blogAttachments] = await Promise.all([
        this.uploadThumbnail(blog.id, thumbnail),
        ...arrayUploadAttachments,
      ]);

      const thumbnailUrl = blogThumbnail
        ? await this.prisma.blogAttachment
            .findUnique({
              where: { id: blogThumbnail.id },
              select: {
                file: {
                  select: { url: true },
                },
              },
            })
            .then((thumbnail) => thumbnail?.file.url)
        : null;

      blog = await this.prisma.blog.update({
        where: { id: blog.id },
        data: {
          thumbnail: thumbnailUrl,
        },
      });

      return blog;
    } catch (error) {
      throw error;
    }
  }

  async deleteBlog(id: number) {
    try {
      const blog = await this.prisma.blog.findUniqueOrThrow({
        where: { id },
      });

      await this.removeBlogsAttachments(blog.id);
      await this.prisma.blog.delete({ where: { id } });

      return {
        message: `Delete blog '${blog.title}' successfully`,
      };
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No blog found');
      throw error;
    }
  }
}
