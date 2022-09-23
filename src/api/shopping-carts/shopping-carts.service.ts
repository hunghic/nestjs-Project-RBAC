import { PrismaService } from '../../prisma/prisma.service';
import { FirebaseDatabaseService } from '../../common/external-services/firebase-admin/firebase-database.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShoppingCartsService {
  constructor(
    private prisma: PrismaService,
    private firebaseDb: FirebaseDatabaseService,
  ) {}

  async getCartDetail(userId: number) {
    try {
      const userCartRef = this.firebaseDb.getNodeReference(
        `users/${userId}/carts`,
      );

      const carts = await userCartRef.once('value');

      const productIds: number[] = [];

      carts.forEach((item) => {
        productIds.push(item.val().productId);
      });

      return await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async addProductToCart(userId: number, productIdentifier: string) {
    try {
      const productId = parseInt(productIdentifier);
      const product = await this.prisma.product.findFirstOrThrow({
        where: {
          OR: [
            { id: isNaN(productId) ? undefined : productId },
            { code: productIdentifier },
            { slug: productIdentifier },
          ],
        },
      });

      const userCartRef = this.firebaseDb.getNodeReference(
        `users/${userId}/carts`,
      );

      await userCartRef.child(`${product.code}`).update({
        productId: product.id,
        productName: product.name,
        addToCartAt: new Date().toISOString(),
      });

      return {
        message: `Add '${product.name} - ${product.code}' to your shopping cart successfully`,
      };
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No product found');
      throw error;
    }
  }

  async removeProductInAllCarts(productCode: string) {
    try {
      const usersInFirebase = await this.firebaseDb
        .getNodeReference('users')
        .once('value');

      usersInFirebase.forEach(function (user) {
        user.ref.child(`carts/${productCode}`).set(null, (error) => {
          if (error)
            Logger.error(
              `Firebase remove product '${productCode}' in all user's carts failed`,
            );
        });
      });
    } catch (error) {
      throw error;
    }
  }

  async removeProductInCart(userId: number, productIdentifier: string) {
    try {
      const productId = parseInt(productIdentifier);
      const product = await this.prisma.product.findFirstOrThrow({
        where: {
          OR: [
            { id: isNaN(productId) ? undefined : productId },
            { code: productIdentifier },
            { slug: productIdentifier },
          ],
        },
      });

      const userCartRef = this.firebaseDb.getNodeReference(
        `users/${userId}/carts`,
      );

      await userCartRef.child(`${product.code}`).set(null);

      return {
        message: `Remove '${product.name} - ${product.code}' in your shopping cart successfully`,
      };
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No product found');
      throw error;
    }
  }
}
