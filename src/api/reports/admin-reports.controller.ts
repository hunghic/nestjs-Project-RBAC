import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { RoleGuard } from '../../common/guards';
import { RequireRole, UserInRequest } from '../../common/decorators';
import { CreateUserReportDto, ResolveReportDto } from './dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports', 'Admin')
@ApiBearerAuth()
@Controller('admin/reports')
@UseGuards(RoleGuard)
@RequireRole(Role.Admin)
export class AdminReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('system')
  getListSystemReports() {
    return this.reportsService.getListSystemReports();
  }

  @Get('system/resolved')
  getListSystemReportsResolved() {
    return this.reportsService.getListSystemReportsResolved();
  }

  @Get('user')
  getListUserReports() {
    return this.reportsService.getListUserReports();
  }

  @Get('user/resolved')
  getListUserReportsResolved() {
    return this.reportsService.getListUserReportsResolved();
  }

  @Get('comment')
  getListCommentReports() {
    return this.reportsService.getListCommentReports();
  }

  @Get('comment/resolved')
  getListCommentReportsResolved() {
    return this.reportsService.getListCommentReportsResolved();
  }

  @Get('system/:id')
  async getSystemReportById(@Param('id', ParseIntPipe) systemReportId: number) {
    try {
      return await this.reportsService.getSystemReportById(systemReportId);
    } catch (error) {
      throw error;
    }
  }

  @Get('user/:id')
  async getUserReportById(@Param('id', ParseIntPipe) userReportId: number) {
    try {
      return await this.reportsService.getUserReportById(userReportId);
    } catch (error) {
      throw error;
    }
  }

  @Get('comment/:id')
  async getCommentReportById(
    @Param('id', ParseIntPipe) commentReportId: number,
  ) {
    try {
      return await this.reportsService.getCommentReportById(commentReportId);
    } catch (error) {
      throw error;
    }
  }

  @Patch('system/:id/resolve')
  async resolveSystemReport(
    @Param('id', ParseIntPipe) systemReportId: number,
    @Body() body: ResolveReportDto,
  ) {
    try {
      return await this.reportsService.resolveSystemReport(
        systemReportId,
        body,
      );
    } catch (error) {
      throw error;
    }
  }

  @Patch('user/:id/resolve')
  async resolveUserReport(
    @Param('id', ParseIntPipe) userReportId: number,
    @Body() body: ResolveReportDto,
  ) {
    try {
      return await this.reportsService.resolveUserReport(userReportId, body);
    } catch (error) {
      throw error;
    }
  }
}
