import { FILE_QUEUE } from './../../common/constants';
import { genExcelFormImportProducts } from './../../common/helper/excel';
import { FavoritesService } from './../favorites/favorites.service';
import { ShoppingCartsService } from './../shopping-carts/shopping-carts.service';
import { generateBarcode } from './../../common/helper/barcode';
import { generateSlug } from './../../common/helper/slug';
import { generateProductCode } from './../../common/helper/nanoid';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { FilesService } from '../../files/files.service';
import {
  AddProductInformationsDto,
  CreateProductDto,
  UpdateProductDto,
  RemoveProductAttributesDto,
  ImportProductDto,
  GetFormImportDto,
  UpdateProductTagsDto,
  GetListProductsDto,
  ProductSortBy,
} from './dto';
import { Prisma, Product } from '@prisma/client';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as XLSX from 'xlsx';

type ProductInfo = Product & {
  category: string;
  tag: string[];
  thumbnail: string;
  productImage: string[];
};

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    private cartsService: ShoppingCartsService,
    private favoritesService: FavoritesService,
    @InjectQueue(FILE_QUEUE) private fileQueue: Queue,
  ) {}

  uploadThumbnail(productId: number, file: Express.Multer.File) {
    if (!file) return;
    return this.filesService.uploadProductImage(productId, file);
  }

  uploadImages(productId: number, files: Express.Multer.File[]) {
    if (!files) return;
    return files.map((file) =>
      this.filesService.uploadProductImage(productId, file),
    );
  }

  async getListProducts(dto: GetListProductsDto) {
    try {
      const take = dto.pageSize;
      const skip = (dto.page - 1) * take;
      const condition = dto.keyword
        ? {
            OR: [
              {
                name: { search: `${dto.keyword}*` },
              },
              {
                name: { contains: dto.keyword },
              },
              {
                category: {
                  name: { search: `${dto.keyword}*` },
                },
              },
              {
                tags: {
                  some: {
                    name: { search: `${dto.keyword}*` },
                  },
                },
              },
              {
                category: {
                  name: { contains: dto.keyword },
                },
              },
              {
                tags: {
                  some: {
                    name: { contains: dto.keyword },
                  },
                },
              },
            ],
          }
        : {};
      const orderBy = {};
      if (dto.sortBy) {
        orderBy[dto.sortBy] = dto.orderSort;
      }
      const totalItems = await this.prisma.product.count({ where: condition });
      const products = await this.prisma.product.findMany({
        where: condition,
        skip,
        take,
        orderBy,
      });
      return {
        products,
        countItems: products.length,
        totalItems,
        pageSize: take,
        totalPages: Math.floor(totalItems / take) + 1,
        currentPage: dto.page,
      };
    } catch (error) {
      throw error;
    }
  }

  async getById(id: number) {
    try {
      return await this.prisma.product
        .findUniqueOrThrow({
          where: { id },
          include: {
            category: {
              select: { name: true },
            },
            tags: {
              select: { name: true },
            },
            thumbnail: {
              select: {
                id: true,
                file: { select: { url: true } },
              },
            },
            productImages: {
              where: {
                thumbnailOfProduct: null,
              },
              select: {
                id: true,
                file: { select: { url: true } },
              },
            },
          },
        })
        .then((product: any) => {
          product.category = product.category ? product.category.name : null;
          product.tags = product.tags.map((tag) => tag.name);
          product.thumbnail = product.thumbnail
            ? product.thumbnail.file.url
            : null;
          product.productImages = product.productImages.map(
            (image) => image.file.url,
          );
          return product as ProductInfo;
        });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No product found');
      throw error;
    }
  }

  async getByCode(code: string) {
    try {
      return await this.prisma.product
        .findUniqueOrThrow({
          where: { code },
          include: {
            category: {
              select: { name: true },
            },
            tags: {
              select: { name: true },
            },
            thumbnail: {
              select: {
                id: true,
                file: { select: { url: true } },
              },
            },
            productImages: {
              where: {
                thumbnailOfProduct: null,
              },
              select: {
                id: true,
                file: { select: { url: true } },
              },
            },
          },
        })
        .then((product: any) => {
          product.category = product.category ? product.category.name : null;
          product.tags = product.tags.map((tag) => tag.name);
          product.thumbnail = product.thumbnail
            ? product.thumbnail.file.url
            : null;
          product.productImages = product.productImages.map(
            (image) => image.file.url,
          );
          return product as ProductInfo;
        });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No product found');
      throw error;
    }
  }

  async getBySlug(slug: string) {
    try {
      return await this.prisma.product
        .findUniqueOrThrow({
          where: { slug },
          include: {
            category: {
              select: { name: true },
            },
            tags: {
              select: { name: true },
            },
            thumbnail: {
              select: {
                id: true,
                file: { select: { url: true } },
              },
            },
            productImages: {
              where: {
                thumbnailOfProduct: null,
              },
              select: {
                id: true,
                file: { select: { url: true } },
              },
            },
          },
        })
        .then((product: any) => {
          product.category = product.category ? product.category.name : null;
          product.tags = product.tags.map((tag) => tag.name);
          product.thumbnail = product.thumbnail
            ? product.thumbnail.file.url
            : null;
          product.productImages = product.productImages.map(
            (image) => image.file.url,
          );
          return product as ProductInfo;
        });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No product found');
      throw error;
    }
  }

  async createProduct(
    dto: CreateProductDto,
    thumbnail: Express.Multer.File,
    images: Express.Multer.File[],
  ) {
    try {
      const { categoryId, ...dataCreate } = dto;
      let product = await this.prisma.product.create({
        data: {
          ...dataCreate,
          code: generateProductCode(),
          category: {
            connect: categoryId ? { id: categoryId } : undefined,
          },
        },
      });

      let slug = generateSlug(dto.name);
      if (await this.prisma.product.findUnique({ where: { slug } }))
        slug += `-${product.code.toLowerCase()}`;

      const [productThumbnail, ...productImages] = await Promise.all([
        this.uploadThumbnail(product.id, thumbnail),
        ...this.uploadImages(product.id, images),
      ]);

      product = await this.prisma.product.update({
        where: { id: product.id },
        data: {
          slug,
          thumbnail: {
            connect: { id: productThumbnail.id },
          },
        },
      });

      return product;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new BadRequestException("Category's ID not existed");
        }
      }
      throw error;
    }
  }

  async updateProduct(
    id: number,
    dto: UpdateProductDto,
    thumbnail: Express.Multer.File,
  ) {
    try {
      const { categoryId, ...dataUpdate } = dto;

      let product = await this.prisma.product.findUniqueOrThrow({
        where: { id },
      });

      const image = thumbnail
        ? await this.filesService.uploadProductImage(id, thumbnail)
        : null;

      let slug = dto.name ? generateSlug(dto.name) : undefined;

      if (slug && (await this.prisma.product.findUnique({ where: { slug } })))
        slug += `-${product.code}`;

      product = await this.prisma.product.update({
        where: { id },
        data: {
          ...dataUpdate,
          slug,
          category: {
            connect: categoryId ? { id: categoryId } : undefined,
          },
          thumbnail: {
            connect: image ? { id: image.id } : undefined,
          },
        },
      });

      return product;
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No product found');
      throw error;
    }
  }

  async updateProductThumbnail(id: number, thumbnail: Express.Multer.File) {
    try {
      await this.prisma.product.findUniqueOrThrow({
        where: { id },
      });

      const image = thumbnail
        ? await this.filesService.uploadProductImage(id, thumbnail)
        : null;

      return await this.prisma.product
        .update({
          where: { id },
          data: {
            thumbnailId: image?.id,
          },
          select: {
            id: true,
            code: true,
            name: true,
            thumbnail: {
              select: { file: { select: { url: true } } },
            },
          },
        })
        .then((product: any) => {
          product.thumbnail = product.thumbnail.file.url;
          return product;
        });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No product found');
      throw error;
    }
  }

  async getProductImages(id: number) {
    try {
      return await this.prisma.product
        .findUniqueOrThrow({
          where: { id },
          select: {
            productImages: {
              select: {
                id: true,
                file: { select: { url: true } },
              },
            },
          },
        })
        .then((product) => {
          return product.productImages.map((image) => ({
            productImageId: image.id,
            url: image.file.url,
          }));
        });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No product found');
      throw error;
    }
  }

  async addProductImages(id: number, files: Express.Multer.File[]) {
    try {
      if (!files || !files.length)
        throw new BadRequestException('No files have been uploaded');

      const product = await this.prisma.product.findUniqueOrThrow({
        where: { id },
      });

      const image = await Promise.all(this.uploadImages(id, files));

      return {
        message: `Add ${image.length} images to '${product.name} - ${product.code}' successfully`,
      };
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No product found');
      throw error;
    }
  }

  async removeProductImages(id: number, productImageIds: number[]) {
    try {
      const product = await this.prisma.product.findUniqueOrThrow({
        where: { id },
      });

      const { fileIds, fileKeys } = await this.prisma.productImage
        .findMany({
          where: {
            productId: id,
            id: {
              in: productImageIds,
            },
          },
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

      const countDeleted = await this.prisma.uploadedFile.deleteMany({
        where: {
          id: { in: fileIds },
          ProductImage: {
            product: {
              id,
            },
          },
        },
      });

      if (countDeleted.count === 0)
        return {
          message: `Successfully removed 0 images of '${product.name} - ${product.code}'`,
        };

      if (!(await this.filesService.removeMultipleFiles(fileKeys)))
        throw new InternalServerErrorException(
          'Remove product image files in storage failed',
        );

      return {
        message: `Successfully removed ${countDeleted.count} images of '${product.name} - ${product.code}'`,
      };
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No product found');
      if (error instanceof Prisma.PrismaClientKnownRequestError)
        throw new InternalServerErrorException();
      throw error;
    }
  }

  async removeAllImages(id: number) {
    try {
      const product = await this.prisma.product.findUniqueOrThrow({
        where: { id },
      });

      const { fileIds, fileKeys } = await this.prisma.productImage
        .findMany({
          where: { productId: id },
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
            ProductImage: {
              product: {
                id,
              },
            },
          },
        });

        if (!(await this.filesService.removeMultipleFiles(fileKeys)))
          throw new InternalServerErrorException(
            'Remove product image files in storage failed',
          );
      }

      return {
        message: `Successfully removed all images of '${product.name} - ${product.code}'`,
      };
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No product found');
      if (error instanceof Prisma.PrismaClientKnownRequestError)
        throw new InternalServerErrorException();
      throw error;
    }
  }

  async deleteProduct(id: number) {
    try {
      const product = await this.prisma.product.findUniqueOrThrow({
        where: { id },
      });

      return this.prisma.$transaction(
        async (_prisma) => {
          await this.removeAllImages(id);
          await _prisma.product.delete({ where: { id } });
          Promise.all([
            this.cartsService.removeProductInAllCarts(product.code),
            this.favoritesService.removeProductInAllFavorites(product.code),
          ]);
          return {
            message: `Delete product '${product.name} - ${product.code}' successfully`,
          };
        },
        {
          timeout: 10000,
        },
      );
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No product found');
      if (error instanceof Prisma.PrismaClientKnownRequestError)
        throw new InternalServerErrorException();
      throw error;
    }
  }

  async genBarcodeFromId(id: number) {
    const product = await this.getById(id);
    return generateBarcode(product.code);
  }

  async genBarcodeFromCode(code: string) {
    const product = await this.getByCode(code);
    return generateBarcode(product.code);
  }

  async genBarcodeFromSlug(slug: string) {
    const product = await this.getBySlug(slug);
    return generateBarcode(product.code);
  }

  async addProductAttributes(id: number, dto: AddProductInformationsDto) {
    try {
      await this.prisma.product.update({
        where: { id },
        data: {
          productDetails: {
            createMany: {
              data: dto.informations.map((info) => ({
                attribute: info.attribute,
                description: info.description,
                subDescription: info.subDescription
                  ? info.subDescription
                  : null,
              })),
            },
          },
        },
      });
      return {
        message: 'Added information successfully',
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('No product found');
        }
        if (error.code === 'P2002') {
          throw new BadRequestException('Some attribute already exists');
        }
      }
      throw error;
    }
  }

  async removeProductAttributes(id: number, dto: RemoveProductAttributesDto) {
    try {
      await this.prisma.product.update({
        where: { id },
        data: {
          productDetails: {
            deleteMany: dto.attributes.map((info: string) => ({
              productId: id,
              attribute: info,
            })),
          },
        },
      });
      return {
        message: 'Remove informations successfully',
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('No product found');
        }
      }
      throw error;
    }
  }

  async addProductTags(id: number, dto: UpdateProductTagsDto) {
    try {
      return await this.prisma.product
        .update({
          where: { id },
          data: {
            tags: {
              connectOrCreate: dto.tags.map((tag) => ({
                where: { name: tag.toLowerCase() },
                create: { name: tag.toLowerCase() },
              })),
            },
          },
          select: {
            id: true,
            code: true,
            name: true,
            tags: true,
          },
        })
        .then(({ tags, ...productInfo }) => ({
          ...productInfo,
          tags: tags.map((tag) => tag.name),
        }));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('No product found');
        }
      }
      throw error;
    }
  }

  async removeProductTags(id: number, dto: UpdateProductTagsDto) {
    try {
      return await this.prisma.product
        .update({
          where: { id },
          data: {
            tags: {
              disconnect: dto.tags.map((tag) => ({
                name: tag,
              })),
            },
          },
          select: {
            id: true,
            code: true,
            name: true,
            tags: true,
          },
        })
        .then(({ tags, ...productInfo }) => ({
          ...productInfo,
          tags: tags.map((tag) => tag.name),
        }));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('No product found');
        }
      }
      throw error;
    }
  }

  async importProduct(id: number, dto: ImportProductDto) {
    try {
      await this.prisma.product.update({
        where: { id },
        data: {
          productImports: {
            create: {
              importQuantity: dto.quantity,
              importPrice: dto.price,
              description: dto.description ? dto.description : null,
            },
          },
          quantityInStock: {
            increment: dto.quantity,
          },
        },
      });

      return {
        message: 'Import product successfully',
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('No product found');
        }
      }
      throw error;
    }
  }

  async importProductsFromExcel(file: Express.Multer.File) {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      await this.fileQueue.add('form-imports', { worksheet });
      return {
        message:
          'The form to import products is being processed, the results will be sent via email to the Admin',
      };
    } catch (error) {
      throw error;
    }
  }

  async getFormImport(dto: GetFormImportDto) {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: dto.productIds?.length ? dto.productIds : [] },
        },
      });
      if (products.length) {
        return genExcelFormImportProducts(products);
      }
      return genExcelFormImportProducts();
    } catch (error) {
      throw error;
    }
  }

  async getProductRatings(id: number) {
    try {
      return await this.prisma.product
        .findFirstOrThrow({
          where: { id },
          select: {
            orderDetails: {
              select: {
                rating: {
                  include: {
                    user: {
                      select: { fullname: true },
                    },
                  },
                },
              },
            },
          },
        })
        .then((product) =>
          product.orderDetails
            .filter((od) => od.rating !== null)
            .map((od) => ({
              ...od.rating,
              user: od.rating.user.fullname,
            })),
        );
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No product found');
      }
      throw error;
    }
  }

  async getProductComments(id: number) {
    try {
      return await this.prisma.product
        .findFirstOrThrow({
          where: { id },
          select: {
            productComments: {
              where: { replyOfCommentId: null },
              include: {
                replyComments: {
                  include: {
                    user: {
                      select: {
                        fullname: true,
                        role: true,
                      },
                    },
                  },
                },
                user: {
                  select: {
                    fullname: true,
                    role: true,
                  },
                },
              },
            },
          },
        })
        .then((product) => product.productComments);
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No product found');
      }
      throw error;
    }
  }

  async getProductFlashSales(id: number) {
    try {
      return await this.prisma.product.findFirstOrThrow({
        where: { id },
        select: {
          id: true,
          code: true,
          name: true,
          flashSales: true,
          currentFlashSale: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No product found');
      }
      throw error;
    }
  }
}
