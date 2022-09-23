import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FirebaseDatabaseService } from '../../common/external-services/firebase-admin/firebase-database.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(
    private prisma: PrismaService,
    private firebaseDb: FirebaseDatabaseService,
  ) {}

  async getFavoritesDetail(userId: number) {
    try {
      const userCartRef = this.firebaseDb.getNodeReference(
        `users/${userId}/favorites`,
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

  async addProductToFavorites(userId: number, productIdentifier: string) {
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

      const userFavoritesRef = this.firebaseDb.getNodeReference(
        `users/${userId}/favorites`,
      );

      await userFavoritesRef.child(`${product.code}`).update({
        productId: product.id,
        productName: product.name,
        addToFavoritesAt: new Date().toISOString(),
      });

      return {
        message: `Add '${product.name} - ${product.code}' to your favorites successfully`,
      };
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No product found');
      throw error;
    }
  }

  async removeProductInAllFavorites(productCode: string) {
    try {
      const usersInFirebase = await this.firebaseDb
        .getNodeReference('users')
        .once('value');

      usersInFirebase.forEach(function (user) {
        user.ref.child(`favorites/${productCode}`).set(null, (error) => {
          if (error)
            Logger.error(
              `Firebase remove product '${productCode}' in all user's favorites failed`,
            );
        });
      });
    } catch (error) {
      throw error;
    }
  }

  async removeProductInFavorites(userId: number, productIdentifier: string) {
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

      const userFavoritesRef = this.firebaseDb.getNodeReference(
        `users/${userId}/favorites`,
      );

      await userFavoritesRef.child(`${product.code}`).set(null);

      return {
        message: `Remove '${product.name} - ${product.code}' in your favorites successfully`,
      };
    } catch (error) {
      if (error instanceof Prisma.NotFoundError)
        throw new NotFoundException('No product found');
      throw error;
    }
  }
}
