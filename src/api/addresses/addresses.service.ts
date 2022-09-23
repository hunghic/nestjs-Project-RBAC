import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  getUserListAddresses(userId: number) {
    return this.prisma.deliveryAddress.findMany({ where: { userId } });
  }

  async getUserAddress(userId: number, addressId: number) {
    try {
      return await this.prisma.deliveryAddress.findFirstOrThrow({
        where: { id: addressId, userId },
      });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No address found');
      throw error;
    }
  }

  async createAddress(user: User, dto: CreateAddressDto) {
    try {
      const receiverName = dto.receiverName ? dto.receiverName : user.fullname;

      return await this.prisma.deliveryAddress.create({
        data: {
          ...dto,
          receiverName,
          user: {
            connect: { id: user.id },
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async updateAddress(
    userId: number,
    addressId: number,
    dto: UpdateAddressDto,
  ) {
    try {
      await this.prisma.deliveryAddress.findFirstOrThrow({
        where: {
          id: addressId,
          userId,
        },
      });

      return await this.prisma.deliveryAddress.update({
        where: { id: addressId },
        data: dto,
      });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No address found');
      throw error;
    }
  }

  async deleteAddress(userId: number, addressId: number) {
    try {
      await this.prisma.deliveryAddress.findFirstOrThrow({
        where: {
          id: addressId,
          userId,
        },
      });

      await this.prisma.deliveryAddress.delete({
        where: { id: addressId },
      });

      return {
        message: `Delete address successfully`,
      };
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No address found');
      throw error;
    }
  }
}
