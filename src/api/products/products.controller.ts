import { ProductsService } from './products.service';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { RoleGuard } from '../../common/guards';
import {
  AddProductImagesDto,
  CreateProductDto,
  RemoveProductImagesDto,
  UpdateProductDto,
  UpdateProductThumbnailDto,
  AddProductInformationsDto,
  RemoveProductAttributesDto,
  ImportProductDto,
  GetFormImportDto,
  FormImportDto,
  UpdateProductTagsDto,
  GetListProductsDto,
} from './dto';
import { RequireRole } from '../../common/decorators';
import { Role } from '@prisma/client';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { imageFileFilter, xlsxFileFilter } from '../../common/helper/multer';
import { Response } from 'express';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(RoleGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  getListProducts(@Query() query: GetListProductsDto) {
    return this.productsService.getListProducts(query);
  }

  @Get(':identifier')
  getProduct(@Param('identifier') identifier: string) {
    const productId = parseInt(identifier);
    if (!isNaN(productId)) return this.productsService.getById(productId);
    if (identifier.length === 14)
      return this.productsService.getByCode(identifier);
    return this.productsService.getBySlug(identifier);
  }

  @Get(':identifier/barcode')
  getProductBarcode(@Param('identifier') identifier: string) {
    const productId = parseInt(identifier);
    if (!isNaN(productId))
      return this.productsService.genBarcodeFromId(productId);
    if (identifier.length === 14)
      return this.productsService.genBarcodeFromCode(identifier);
    return this.productsService.genBarcodeFromSlug(identifier);
  }

  @Get(':id/images')
  getProductImages(@Param('id', ParseIntPipe) productId: number) {
    return this.productsService.getProductImages(productId);
  }

  @Get(':id/ratings')
  getProductRatings(@Param('id', ParseIntPipe) productId: number) {
    return this.productsService.getProductRatings(productId);
  }

  @Get(':id/comments')
  getProductComments(@Param('id', ParseIntPipe) productId: number) {
    return this.productsService.getProductComments(productId);
  }

  @Get(':id/flash-sales')
  getProductFlashSales(@Param('id', ParseIntPipe) productId: number) {
    return this.productsService.getProductFlashSales(productId);
  }

  @ApiConsumes('multipart/form-data')
  @RequireRole(Role.Admin)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'images' }, { name: 'thumbnail', maxCount: 1 }],
      {
        limits: { fileSize: 20 * 1024 * 1024 /* 20MB */ },
        fileFilter: imageFileFilter,
      },
    ),
  )
  async createProduct(
    @Body() body: CreateProductDto,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
    @Req() req: any,
  ) {
    try {
      if (req.fileValidationError)
        throw new BadRequestException(req.fileValidationError.message);

      const thumbnail = files.thumbnail ? files.thumbnail[0] : undefined;
      const images = files.images;

      return this.productsService.createProduct(body, thumbnail, images);
    } catch (error) {
      throw error;
    }
  }

  @ApiConsumes('multipart/form-data')
  @RequireRole(Role.Admin)
  @Put(':id')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      limits: { fileSize: 20 * 1024 * 1024 /* 20MB */ },
      fileFilter: imageFileFilter,
    }),
  )
  async updateProduct(
    @Param('id', ParseIntPipe) productId: number,
    @Body() body: UpdateProductDto,
    @UploadedFile() thumbnail: Express.Multer.File,
    @Req() req: any,
  ) {
    try {
      if (req.fileValidationError)
        throw new BadRequestException(req.fileValidationError.message);
      return this.productsService.updateProduct(productId, body, thumbnail);
    } catch (error) {
      throw error;
    }
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Product thumbnail',
    type: UpdateProductThumbnailDto,
  })
  @RequireRole(Role.Admin)
  @Patch(':id/thumbnail')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      limits: { fileSize: 20 * 1024 * 1024 /* 20MB */ },
      fileFilter: imageFileFilter,
    }),
  )
  async updateProductThumbnail(
    @Param('id', ParseIntPipe) productId: number,
    @UploadedFile() thumbnail: Express.Multer.File,
    @Req() req: any,
  ) {
    try {
      if (req.fileValidationError)
        throw new BadRequestException(req.fileValidationError.message);
      return this.productsService.updateProductThumbnail(productId, thumbnail);
    } catch (error) {
      throw error;
    }
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Product images',
    type: AddProductImagesDto,
  })
  @RequireRole(Role.Admin)
  @Post(':id/images')
  @HttpCode(200)
  @UseInterceptors(
    FilesInterceptor('images', undefined, {
      limits: { fileSize: 20 * 1024 * 1024 /* 20MB */ },
      fileFilter: imageFileFilter,
    }),
  )
  async addProductImages(
    @Param('id', ParseIntPipe) productId: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    try {
      if (req.fileValidationError)
        throw new BadRequestException(req.fileValidationError.message);

      return this.productsService.addProductImages(productId, files);
    } catch (error) {
      throw error;
    }
  }

  @RequireRole(Role.Admin)
  @Delete(':id/images')
  async removeProductImages(
    @Param('id', ParseIntPipe) productId: number,
    @Body() body: RemoveProductImagesDto,
  ) {
    try {
      return this.productsService.removeProductImages(
        productId,
        body.productImageIds,
      );
    } catch (error) {
      throw error;
    }
  }

  @RequireRole(Role.Admin)
  @Delete(':id/images/all')
  async removeAllProductImages(@Param('id', ParseIntPipe) productId: number) {
    try {
      return this.productsService.removeAllImages(productId);
    } catch (error) {
      throw error;
    }
  }

  @RequireRole(Role.Admin)
  @Delete(':id')
  async deleteProduct(@Param('id', ParseIntPipe) productId: number) {
    try {
      return this.productsService.deleteProduct(productId);
    } catch (error) {
      throw error;
    }
  }

  @RequireRole(Role.Admin)
  @Post(':id/informations')
  async addProductInformations(
    @Param('id', ParseIntPipe) productId: number,
    @Body() body: AddProductInformationsDto,
  ) {
    try {
      return this.productsService.addProductAttributes(productId, body);
    } catch (error) {
      throw error;
    }
  }

  @RequireRole(Role.Admin)
  @Delete(':id/informations')
  async removeProductInformations(
    @Param('id', ParseIntPipe) productId: number,
    @Body() body: RemoveProductAttributesDto,
  ) {
    try {
      return this.productsService.removeProductAttributes(productId, body);
    } catch (error) {
      throw error;
    }
  }

  @RequireRole(Role.Admin)
  @Post(':id/tags')
  async addProductTags(
    @Param('id', ParseIntPipe) productId: number,
    @Body() body: UpdateProductTagsDto,
  ) {
    try {
      return this.productsService.addProductTags(productId, body);
    } catch (error) {
      throw error;
    }
  }

  @RequireRole(Role.Admin)
  @Delete(':id/tags')
  async removeProductTags(
    @Param('id', ParseIntPipe) productId: number,
    @Body() body: UpdateProductTagsDto,
  ) {
    try {
      return this.productsService.removeProductTags(productId, body);
    } catch (error) {
      throw error;
    }
  }

  @RequireRole(Role.Admin)
  @Post(':id/import')
  async importProduct(
    @Param('id', ParseIntPipe) productId: number,
    @Body() body: ImportProductDto,
  ) {
    try {
      return this.productsService.importProduct(productId, body);
    } catch (error) {
      throw error;
    }
  }

  @RequireRole(Role.Admin)
  @Get('import/form')
  async getFormImport(@Body() body: GetFormImportDto, @Res() res: Response) {
    try {
      res.attachment('product-imports.xlsx');
      res.end(await this.productsService.getFormImport(body));
    } catch (error) {
      throw error;
    }
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Form import products',
    type: FormImportDto,
  })
  @RequireRole(Role.Admin)
  @Post('import/form')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 /* 20MB */ },
      fileFilter: xlsxFileFilter,
    }),
  )
  async importProductFromForm(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    try {
      if (req.fileValidationError)
        throw new BadRequestException(req.fileValidationError.message);

      return this.productsService.importProductsFromExcel(file);
    } catch (error) {
      throw error;
    }
  }
}
