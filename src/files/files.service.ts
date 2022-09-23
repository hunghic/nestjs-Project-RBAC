import { AwsS3Service } from '../common/external-services/aws-s3/aws-s3.service';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  BlogAttachment,
  CategoryImage,
  ProductImage,
  UserAvatar,
} from '@prisma/client';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService, private s3Service: AwsS3Service) {}

  async removeFile(fileKey: string) {
    try {
      await this.s3Service.deleteFile(fileKey);
      return true;
    } catch (error) {
      throw error;
    }
  }

  async removeMultipleFiles(fileKeys: string[]) {
    try {
      await this.s3Service.deleteMultipleFiles(fileKeys);
      return true;
    } catch (error) {
      throw error;
    }
  }

  async uploadUserAvatar(
    userId: number,
    avatar: Express.Multer.File,
  ): Promise<UserAvatar> {
    try {
      const uploadResult = await this.s3Service.uploadFile(
        avatar.originalname,
        avatar.buffer,
        avatar.mimetype,
        `users/${userId}/avatars`,
      );

      const uploadedFile = await this.prisma.uploadedFile.create({
        data: {
          url: uploadResult.Location,
          key: uploadResult.Key,
        },
      });

      const useAvatar = await this.prisma.userAvatar.create({
        data: {
          fileId: uploadedFile.id,
          ownerId: userId,
        },
      });

      return useAvatar;
    } catch (error) {
      throw error;
    }
  }

  async uploadCategoryImage(
    categoryId: number,
    file: Express.Multer.File,
  ): Promise<CategoryImage> {
    try {
      const uploadResult = await this.s3Service.uploadFile(
        file.originalname,
        file.buffer,
        file.mimetype,
        `categories/${categoryId}/images`,
      );

      const uploadedFile = await this.prisma.uploadedFile.create({
        data: {
          url: uploadResult.Location,
          key: uploadResult.Key,
        },
      });

      const categoryImage = await this.prisma.categoryImage.create({
        data: {
          fileId: uploadedFile.id,
          categoryId: categoryId,
        },
      });

      return categoryImage;
    } catch (error) {
      throw error;
    }
  }

  async uploadProductImage(
    productId: number,
    file: Express.Multer.File,
  ): Promise<ProductImage> {
    try {
      const uploadResult = await this.s3Service.uploadFile(
        file.originalname,
        file.buffer,
        file.mimetype,
        `products/${productId}/images`,
      );

      const uploadedFile = await this.prisma.uploadedFile.create({
        data: {
          url: uploadResult.Location,
          key: uploadResult.Key,
        },
      });

      const productImage = await this.prisma.productImage.create({
        data: {
          fileId: uploadedFile.id,
          productId: productId,
        },
      });

      return productImage;
    } catch (error) {
      throw error;
    }
  }

  async sendFileMessage(chatroomId: number, file: Express.Multer.File) {
    try {
      const uploadResult = await this.s3Service.uploadFile(
        file.originalname,
        file.buffer,
        file.mimetype,
        `conversations/${chatroomId}/files`,
      );

      const uploadedFile = await this.prisma.uploadedFile.create({
        data: {
          url: uploadResult.Location,
          key: uploadResult.Key,
        },
      });

      return uploadedFile;
    } catch (error) {
      throw error;
    }
  }

  async uploadBlogAttachment(
    blogId: number,
    file: Express.Multer.File,
  ): Promise<BlogAttachment> {
    try {
      const uploadResult = await this.s3Service.uploadFile(
        file.originalname,
        file.buffer,
        file.mimetype,
        `blogs/${blogId}/attachments`,
      );

      const uploadedFile = await this.prisma.uploadedFile.create({
        data: {
          url: uploadResult.Location,
          key: uploadResult.Key,
        },
      });

      const blogAttachment = await this.prisma.blogAttachment.create({
        data: {
          fileId: uploadedFile.id,
          blogId,
        },
      });

      return blogAttachment;
    } catch (error) {
      throw error;
    }
  }
}
