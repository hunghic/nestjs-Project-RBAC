import { MailService } from './../../notifications/mail/mail.service';
import { PrismaService } from './../../prisma/prisma.service';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateFlashSaleDto } from './dto';
import { FlashSale, Prisma, Product, Role } from '@prisma/client';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { CreateGeneralNotificationDto } from '../../notifications/dto';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class FlashSalesService {
  constructor(
    private prisma: PrismaService,
    private schedulerRegistry: SchedulerRegistry,
    private mailService: MailService,
    private notiService: NotificationsService,
  ) {}

  getAllFlashSales() {
    return this.prisma.flashSale.findMany({
      include: {
        currentOfProduct: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async getFlashSaleById(id: number) {
    try {
      return await this.prisma.flashSale.findUniqueOrThrow({
        where: { id },
        include: { currentOfProduct: true },
      });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new BadRequestException('No flashsale found');
      }
      throw error;
    }
  }

  async createFlashSale(dto: CreateFlashSaleDto) {
    try {
      if (dto.startAt < new Date() || dto.startAt > dto.dueAt)
        throw new BadRequestException('Flash sale time is not valid');

      const product = await this.prisma.product.findUniqueOrThrow({
        where: { id: dto.productId },
        include: {
          flashSales: true,
        },
      });

      product.flashSales.forEach((flashSale) => {
        if (dto.dueAt < flashSale.startAt || dto.startAt > flashSale.dueAt)
          return;
        throw new BadRequestException(
          'There was a flashsale that existed during this time',
        );
      });

      if (dto.flashSalePrice > product.salePrice)
        throw new BadRequestException('Flash sale price is not valid');

      if (dto.flashSaleQuantity > product.quantityInStock)
        throw new BadRequestException(
          'Products quantity in stock is not enough flash sale quantity',
        );

      const flashSale = await this.prisma.flashSale.create({
        data: {
          productId: product.id,
          previousPrice: product.salePrice,
          flashSalePrice: dto.flashSalePrice,
          previousQuantity: product.quantityInStock,
          flashSaleQuantity: dto.flashSaleQuantity,
          startAt: dto.startAt,
          dueAt: dto.dueAt,
        },
        include: {
          product: true,
        },
      });

      await Promise.all([
        this.notiFlashSale(flashSale, 2),
        this.enableFlashSale(flashSale),
        this.disableFlashSale(flashSale),
      ]);

      return flashSale;
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new BadRequestException('No product found');
      }
      throw error;
    }
  }

  async notiFlashSale(
    flashSale: FlashSale & {
      product: Product;
    },
    beforeMinutes = 15,
  ) {
    try {
      const userIds = await this.prisma.user
        .findMany({
          where: {
            role: Role.User,
          },
          select: { id: true },
        })
        .then((users) => users.map((user) => user.id));

      const notiOptions: CreateGeneralNotificationDto = {
        title: `FlashSale cho sản phẩm '${flashSale.product.name}'`,
        content: `Bắt đầu lúc ${flashSale.startAt.toLocaleString()}`,
        description: `Giá giảm từ ${flashSale.product.listedPrice}đ xuống còn ${flashSale.flashSalePrice}đ`,
      };

      const notiAt = new Date(
        flashSale.startAt.getTime() - beforeMinutes * 60 * 1000,
      );

      const notiJob = new CronJob(notiAt, async () => {
        console.log(`thong bao flash sale #${flashSale.id}`);
        try {
          this.notiService.createGeneralNotification(notiOptions);
          this.mailService.sendNotiFlashSaleToUsers(userIds, flashSale.id);
        } catch (error) {
          throw error;
        }
      });

      this.schedulerRegistry.addCronJob(
        `Notification flashsale #${flashSale.id}`,
        notiJob,
      );

      notiJob.start();
    } catch (error) {
      throw error;
    }
  }

  async enableFlashSale(flashSale: FlashSale) {
    try {
      const enableJob = new CronJob(flashSale.startAt, async () => {
        // console.log(`chay flash sale #${flashSale.id}`);
        try {
          const product = await this.prisma.product.findFirst({
            where: {
              id: flashSale.productId,
              flashSales: {
                some: { id: flashSale.id },
              },
            },
          });
          if (!product) return;
          flashSale = await this.prisma.flashSale.update({
            where: { id: flashSale.id },
            data: {
              previousPrice: product.salePrice,
              flashSalePrice:
                flashSale.flashSalePrice > product.salePrice
                  ? product.salePrice
                  : flashSale.flashSalePrice,
              previousQuantity: product.quantityInStock,
              flashSaleQuantity:
                flashSale.flashSaleQuantity > product.quantityInStock
                  ? product.quantityInStock
                  : flashSale.flashSaleQuantity,
            },
          });
          if (!flashSale) return;
          await this.prisma.product.update({
            where: { id: flashSale.productId },
            data: {
              salePrice: flashSale.flashSalePrice,
              quantityInStock: flashSale.flashSaleQuantity,
              currentFlashSale: {
                connect: { id: flashSale.id },
              },
            },
          });

          return;
        } catch (error) {
          throw error;
        }
      });

      this.schedulerRegistry.addCronJob(
        `Enable flashsale #${flashSale.id}`,
        enableJob,
      );

      enableJob.start();
      return;
    } catch (error) {
      throw error;
    }
  }

  async disableFlashSale(flashSale: FlashSale) {
    try {
      const disableJob = new CronJob(flashSale.dueAt, async () => {
        // console.log(`tat flash sale #${flashSale.id}`);
        try {
          flashSale = await this.prisma.flashSale.findFirst({
            where: {
              id: flashSale.id,
              currentOfProduct: {
                id: flashSale.productId,
              },
            },
          });
          if (!flashSale) return;
          await this.prisma.product.update({
            where: { id: flashSale.productId },
            data: {
              salePrice: flashSale.previousPrice,
              quantityInStock: {
                increment:
                  flashSale.previousQuantity - flashSale.flashSaleQuantity,
              },
              currentFlashSale: {
                disconnect: true,
              },
            },
          });
          await this.prisma.flashSale.delete({
            where: { id: flashSale.id },
          });

          return;
        } catch (error) {
          throw error;
        }
      });

      this.schedulerRegistry.addCronJob(
        `Disable flashsale #${flashSale.id}`,
        disableJob,
      );

      disableJob.start();
      return;
    } catch (error) {
      throw error;
    }
  }

  async deleteFlashSale(id: number) {
    try {
      const flashSale = await this.prisma.flashSale.findUniqueOrThrow({
        where: { id },
        include: {
          currentOfProduct: true,
        },
      });

      if (flashSale.currentOfProduct) {
        await this.prisma.product.update({
          where: { id: flashSale.currentOfProduct.id },
          data: {
            salePrice: flashSale.previousPrice,
            quantityInStock: {
              increment:
                flashSale.previousQuantity - flashSale.flashSaleQuantity,
            },
            currentFlashSale: {
              disconnect: true,
            },
          },
        });
      }

      await this.prisma.flashSale.delete({
        where: { id },
      });

      return {
        message: `Delete flashsale #${id} successfully`,
      };
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No flashsale found');
      }
      throw error;
    }
  }
}
