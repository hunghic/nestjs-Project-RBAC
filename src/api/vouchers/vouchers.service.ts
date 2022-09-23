import { generateVoucherCode } from './../../common/helper/nanoid';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGeneralVoucherDto, CreatePersonalVoucherDto } from './dto';
import {
  Prisma,
  VoucherStatus,
  VoucherType,
  VoucherUnit,
} from '@prisma/client';

@Injectable()
export class VouchersService {
  constructor(private prisma: PrismaService) {}

  async getAvailableVouchersOfUser(userId) {
    try {
      return await this.prisma.voucher.findMany({
        where: {
          OR: [
            {
              type: VoucherType.Personal,
              usersOfVoucher: {
                some: { userId, status: VoucherStatus.NotUsed },
              },
            },
            {
              type: VoucherType.General,
              usersOfVoucher: {
                none: { userId, status: VoucherStatus.Used },
              },
            },
          ],
          dueAt: {
            gte: new Date(),
          },
          remainQuantity: {
            gt: 0,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async createGeneralVoucher(dto: CreateGeneralVoucherDto) {
    try {
      if (dto.unit === VoucherUnit.Percent && dto.valueDiscount > 100)
        throw new BadRequestException('Voucher cannot be more than 100%');
      return await this.prisma.voucher.create({
        data: {
          code: dto.customCode ? dto.customCode : generateVoucherCode(),
          value: dto.valueDiscount,
          unit: dto.unit,
          maxDiscount: dto.maxDiscount,
          minOrderPrice: dto.minOrderPrice,
          startAt: dto.startAt,
          dueAt: dto.dueAt,
          type: VoucherType.General,
          remainQuantity: dto.quantity,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new BadRequestException('Voucher code already exists');
      }
      throw error;
    }
  }

  async createPersonalVoucher(dto: CreatePersonalVoucherDto) {
    try {
      if (dto.unit === VoucherUnit.Percent && dto.valueDiscount > 100)
        throw new BadRequestException('Voucher cannot be more than 100%');
      return await this.prisma.voucher.create({
        data: {
          code: dto.customCode ? dto.customCode : generateVoucherCode(),
          value: dto.valueDiscount,
          unit: dto.unit,
          maxDiscount: dto.maxDiscount,
          minOrderPrice: dto.minOrderPrice,
          startAt: dto.startAt,
          dueAt: dto.dueAt,
          type: VoucherType.Personal,
          remainQuantity: dto.voucherUserIds.length,
          usersOfVoucher: {
            createMany: {
              data: dto.voucherUserIds.map((userId) => ({
                userId,
              })),
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new BadRequestException('Voucher code already exists');
        if (error.code === 'P2003')
          throw new BadRequestException('Some user does not exist');
      }
      throw error;
    }
  }

  async deleteVoucher(id: number) {
    try {
      await this.prisma.voucher.delete({ where: { id } });
      return {
        message: 'Delete voucher successfully',
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025')
          throw new NotFoundException('No voucher found');
      }
      throw error;
    }
  }
}
