import { PrismaService } from './../../prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Tag } from '@prisma/client';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async getAllTags(): Promise<Tag[]> {
    return this.prisma.tag.findMany();
  }

  async getById(id: number): Promise<Tag> {
    return this.prisma.tag.findUnique({
      where: { id },
    });
  }

  async getByTagName(tagName: string): Promise<Tag> {
    return this.prisma.tag.findUnique({
      where: { name: tagName },
    });
  }

  async createTag(tagName: string): Promise<Tag> {
    try {
      const tag = await this.prisma.tag.create({
        data: {
          name: tagName,
        },
      });

      return tag;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('TagName already exists and unique');
        }
      }
      throw error;
    }
  }

  async updateName(id: number, tagName: string): Promise<Tag> {
    try {
      const tag = await this.prisma.tag.update({
        where: { id },
        data: { name: tagName },
      });

      return tag;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('TagName already exists and unique');
        }
        if (error.code === 'P2025') {
          throw new BadRequestException("Tag's ID not existed");
        }
      }
      throw error;
    }
  }

  async deleteTag(id: number) {
    try {
      await this.prisma.tag.delete({ where: { id } });
      return {
        message: 'Delete Tag successfully',
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new BadRequestException("Tag's ID not existed");
        }
      }
      throw error;
    }
  }

  async getProductsOfTagId(id: number) {
    try {
      return await this.prisma.tag.findUnique({
        where: { id },
        include: {
          products: true,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async getProductsOfTagName(tagName: string) {
    try {
      return await this.prisma.tag.findUnique({
        where: { name: tagName },
        include: {
          products: true,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async getBlogsOfTagId(id: number) {
    try {
      return await this.prisma.tag.findUnique({
        where: { id },
        include: {
          blogs: true,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async getBlogsOfTagName(tagName: string) {
    try {
      return await this.prisma.tag.findUnique({
        where: { name: tagName },
        include: {
          blogs: true,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
