import { NotificationsService } from './../../notifications/notifications.service';
import { MailService } from './../../notifications/mail/mail.service';
import { PrismaService } from './../../prisma/prisma.service';
import { Injectable, BadRequestException } from '@nestjs/common';
import {
  CreateCommentReportDto,
  CreateSystemReportDto,
  CreateUserReportDto,
  ResolveReportDto,
} from './dto';
import { Prisma, ReportStatus, UserReportType } from '@prisma/client';
import { CreateSpecificNotificationDto } from '../../notifications/dto';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private notiService: NotificationsService,
  ) {}

  getListSystemReports() {
    return this.prisma.systemReport.findMany({
      where: {
        resolveStatus: ReportStatus.Waiting,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  getListSystemReportsResolved() {
    return this.prisma.systemReport.findMany({
      where: {
        resolveStatus: {
          not: ReportStatus.Waiting,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  getListCommentReports() {
    return this.prisma.userReport.findMany({
      where: {
        type: UserReportType.CommentViolation,
        commentId: { not: null },
        resolveStatus: ReportStatus.Waiting,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  getListCommentReportsResolved() {
    return this.prisma.userReport.findMany({
      where: {
        type: UserReportType.CommentViolation,
        commentId: { not: null },
        resolveStatus: { not: ReportStatus.Waiting },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  getListUserReports() {
    return this.prisma.userReport.findMany({
      where: {
        type: UserReportType.Other,
        resolveStatus: ReportStatus.Waiting,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  getListUserReportsResolved() {
    return this.prisma.userReport.findMany({
      where: {
        type: UserReportType.Other,
        resolveStatus: { not: ReportStatus.Waiting },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async getSystemReportById(id: number) {
    try {
      return await this.prisma.systemReport.findUniqueOrThrow({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new BadRequestException('No report found');
      }
      throw error;
    }
  }

  async getCommentReportById(id: number) {
    try {
      return await this.prisma.userReport.findFirstOrThrow({
        where: {
          id,
          type: UserReportType.CommentViolation,
          commentId: { not: null },
        },
        include: {
          comment: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new BadRequestException('No report found');
      }
      throw error;
    }
  }

  async getUserReportById(id: number) {
    try {
      return await this.prisma.userReport.findFirstOrThrow({
        where: {
          id,
          type: UserReportType.Other,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new BadRequestException('No report found');
      }
      throw error;
    }
  }

  async createSystemReport(userId: number, dto: CreateSystemReportDto) {
    try {
      return await this.prisma.systemReport.create({
        data: {
          reporterId: userId,
          type: dto.reportType,
          content: dto.content,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async createCommentReport(userId: number, dto: CreateCommentReportDto) {
    try {
      const comment = await this.prisma.productComment.findUniqueOrThrow({
        where: {
          id: dto.commentId,
        },
      });
      return await this.prisma.userReport.create({
        data: {
          reporterId: userId,
          reporteeId: comment.userId,
          type: UserReportType.CommentViolation,
          commentId: comment.id,
          content: dto.content,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new BadRequestException('No comment found');
      }
      throw error;
    }
  }

  async createUserReport(userId: number, dto: CreateUserReportDto) {
    try {
      return await this.prisma.userReport.create({
        data: {
          reporterId: userId,
          reporteeId: dto.reporteeId,
          type: UserReportType.Other,
          content: dto.content,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async resolveSystemReport(id: number, dto: ResolveReportDto) {
    try {
      let report = await this.prisma.systemReport.findUniqueOrThrow({
        where: { id },
      });

      report = await this.prisma.systemReport.update({
        where: {
          id,
        },
        data: {
          resolveStatus:
            dto.decide === 'Resolve'
              ? ReportStatus.Resolved
              : dto.decide === 'Refuse'
              ? ReportStatus.Refused
              : undefined,
          resolveContent: dto.reason,
        },
      });

      if (report.resolveStatus !== ReportStatus.Waiting) {
        const reporter = await this.prisma.user.findUnique({
          where: { id: report.reporterId },
        });
        const notiOptions: CreateSpecificNotificationDto = {
          title: `Phản hồi báo cáo`,
          content: `Báo cáo #${report.id} của bạn đã được Admin phản hồi qua email, vui lòng kiểm tra.`,
          userIds: [report.reporterId],
        };

        Promise.all([
          this.notiService.createSpecificNotification(notiOptions),
          this.mailService.sendResponseSystemReport(reporter, report),
        ]);
      }

      return report;
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new BadRequestException('No report found');
      }
      throw error;
    }
  }

  async resolveUserReport(id: number, dto: ResolveReportDto) {
    try {
      let report = await this.prisma.userReport.findUniqueOrThrow({
        where: { id },
        include: {
          reportee: {
            select: { fullname: true },
          },
        },
      });

      report = await this.prisma.userReport.update({
        where: {
          id,
        },
        data: {
          resolveStatus:
            dto.decide == 'Resolve'
              ? ReportStatus.Resolved
              : dto.decide == 'Refuse'
              ? ReportStatus.Refused
              : undefined,
          resolveContent: dto.reason,
        },
        include: {
          reportee: {
            select: { fullname: true },
          },
        },
      });

      if (report.resolveStatus !== ReportStatus.Waiting) {
        const reporter = await this.prisma.user.findUnique({
          where: { id: report.reporterId },
        });
        const notiOptions: CreateSpecificNotificationDto = {
          title: `Phản hồi báo cáo`,
          content: `Báo cáo #${report.id} của bạn đã được Admin phản hồi qua email, vui lòng kiểm tra.`,
          userIds: [report.reporterId],
        };

        Promise.all([
          this.notiService.createSpecificNotification(notiOptions),
          this.mailService.sendResponseUserReport(reporter, report),
        ]);
      }

      return report;
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new BadRequestException('No report found');
      }
      throw error;
    }
  }
}
