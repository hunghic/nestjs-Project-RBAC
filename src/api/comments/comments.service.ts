import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto, ReplyCommentDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async createComment(userId: number, dto: CreateCommentDto) {
    try {
      return await this.prisma.productComment.create({
        data: {
          userId,
          content: dto.content,
          productId: dto.productId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException('Product does not exist');
        }
      }
      throw error;
    }
  }

  async replyComment(userId: number, commentId: number, dto: ReplyCommentDto) {
    try {
      const comment = await this.prisma.productComment.findUniqueOrThrow({
        where: { id: commentId },
      });

      const replyOfCommentId = comment.replyOfCommentId || comment.id;

      return await this.prisma.productComment
        .update({
          where: {
            id: replyOfCommentId,
          },
          data: {
            replyComments: {
              create: {
                userId,
                content: dto.content,
                productId: comment.productId,
              },
            },
          },
          select: {
            replyComments: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        })
        .then((rootComment) => rootComment.replyComments[0]);
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No comment found');
      }
      throw error;
    }
  }

  async deleteComment(userId: number, commentId: number) {
    try {
      await this.prisma.productComment.findFirstOrThrow({
        where: {
          id: commentId,
          userId,
        },
      });

      await this.prisma.productComment.delete({
        where: {
          id: commentId,
        },
      });

      return {
        message: `Delete product comment successfully`,
      };
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No comment found');
      }
      throw error;
    }
  }

  async adminDeleteComment(id: number) {
    try {
      await this.prisma.productComment.findUniqueOrThrow({ where: { id } });

      await this.prisma.productComment.delete({ where: { id } });

      return {
        message: "Delete user's comment successfully",
      };
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No comment found');
      }
      throw error;
    }
  }
}
