import { imageFileFilter } from './../../common/helper/multer';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  UpdateCategoryThumbnailDto,
} from './dto';
import { RoleGuard } from './../../common/guards';
import { CategoriesService } from './categories.service';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { RequireRole } from '../../common/decorators';
import { Role } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(RoleGuard)
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  getAllCategories() {
    return this.categoriesService.getAllCategories();
  }

  @ApiConsumes('multipart/form-data')
  @RequireRole(Role.Admin)
  @Post()
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      limits: { fileSize: 20 * 1024 * 1024 /* 20MB */ },
      fileFilter: imageFileFilter,
    }),
  )
  async createCategory(
    @Body() body: CreateCategoryDto,
    @UploadedFile() thumbnail: Express.Multer.File,
    @Req() req: any,
  ) {
    try {
      if (req.fileValidationError)
        throw new BadRequestException(req.fileValidationError.message);

      return this.categoriesService.createCategory(body, thumbnail);
    } catch (error) {
      throw error;
    }
  }

  @RequireRole(Role.Admin)
  @Put(':id')
  async updateCategory(
    @Param('id', ParseIntPipe) categoryId: number,
    @Body() body: UpdateCategoryDto,
  ) {
    try {
      return this.categoriesService.updateCategory(categoryId, body);
    } catch (error) {
      throw error;
    }
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Category thumbnail file',
    type: UpdateCategoryThumbnailDto,
  })
  @RequireRole(Role.Admin)
  @Patch(':id/thumbnail')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      limits: { fileSize: 20 * 1024 * 1024 /* 20MB */ },
      fileFilter: imageFileFilter,
    }),
  )
  async updateCategoryThumbnail(
    @Param('id', ParseIntPipe) categoryId: number,
    @UploadedFile() thumbnail: Express.Multer.File,
    @Req() req: any,
  ) {
    try {
      if (req.fileValidationError)
        throw new BadRequestException(req.fileValidationError.message);

      return this.categoriesService.updateCategoryThumbnail(
        categoryId,
        thumbnail,
      );
    } catch (error) {
      throw error;
    }
  }

  @RequireRole(Role.Admin)
  @Delete(':id')
  async deleteCategory(@Param('id', ParseIntPipe) categoryId: number) {
    try {
      return this.categoriesService.deleteCategory(categoryId);
    } catch (error) {
      throw error;
    }
  }

  @Get(':identifier/products')
  async getProductsByCategory(@Param('identifier') categoryIdentifier: string) {
    try {
      const categoryId = parseInt(categoryIdentifier);
      if (isNaN(categoryId))
        return this.categoriesService.getProductsOfCategorySlug(
          categoryIdentifier,
        );
      return this.categoriesService.getProductsOfCategoryId(categoryId);
    } catch (error) {
      throw error;
    }
  }
}
