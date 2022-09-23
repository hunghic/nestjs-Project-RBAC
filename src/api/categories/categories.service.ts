import { FilesService } from './../../files/files.service';
import { generateSlug } from './../../common/helper/slug';
import { PrismaService } from './../../prisma/prisma.service';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  async getAllCategories() {
    return this.prisma.category.findMany();
  }

  async createCategory(dto: CreateCategoryDto, thumbnail: Express.Multer.File) {
    try {
      let category = await this.prisma.category.create({
        data: dto,
      });

      let slug = generateSlug(category.name);
      const categoryWithSlug = await this.prisma.category.findUnique({
        where: { slug },
      });

      if (categoryWithSlug) slug += `-${category.id}`;

      const image = thumbnail
        ? await this.filesService.uploadCategoryImage(category.id, thumbnail)
        : null;

      category = await this.prisma.category.update({
        where: { id: category.id },
        data: {
          slug,
          thumbnailId: image?.id,
        },
        include: {
          thumbnail: {
            select: {
              file: true,
            },
          },
        },
      });

      return category;
    } catch (error) {
      throw error;
    }
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    try {
      await this.prisma.category.findUniqueOrThrow({ where: { id } });

      let slug = dto.name ? generateSlug(dto.name) : undefined;

      if (slug && (await this.prisma.category.findUnique({ where: { slug } })))
        slug += `-${id}`;

      const category = await this.prisma.category.update({
        where: { id },
        data: {
          ...dto,
          slug,
        },
      });

      return category;
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException(error.message);
      throw error;
    }
  }

  async updateCategoryThumbnail(id: number, thumbnail: Express.Multer.File) {
    try {
      await this.prisma.category.findUniqueOrThrow({ where: { id } });

      const image = thumbnail
        ? await this.filesService.uploadCategoryImage(id, thumbnail)
        : null;

      return await this.prisma.category.update({
        where: { id },
        data: {
          thumbnailId: image?.id,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException(error.message);
      throw error;
    }
  }

  async deleteCategory(id: number) {
    try {
      await this.prisma.category.findUniqueOrThrow({ where: { id } });

      const { fileIds, fileKeys } = await this.prisma.categoryImage
        .findMany({
          where: { categoryId: id },
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

      const deleteUploadedFiles = this.prisma.uploadedFile.deleteMany({
        where: {
          id: {
            in: fileIds,
          },
          CategoryImage: {
            isNot: null,
          },
        },
      });

      const deleteCategory = this.prisma.category.delete({ where: { id } });

      await this.prisma.$transaction([deleteUploadedFiles, deleteCategory]);

      if (!(await this.filesService.removeMultipleFiles(fileKeys)))
        throw new InternalServerErrorException(
          'Remove category image files in storage failed',
        );

      return {
        messages: 'Delete category successfully',
      };
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException(error.message);
      if (error instanceof Prisma.PrismaClientKnownRequestError)
        throw new InternalServerErrorException();
      throw error;
    }
  }

  async getProductsOfCategoryId(id: number) {
    try {
      return await this.prisma.category.findUnique({
        where: { id },
        include: {
          products: true,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async getProductsOfCategorySlug(slug: string) {
    try {
      return await this.prisma.category.findUnique({
        where: { slug },
        include: {
          products: true,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
