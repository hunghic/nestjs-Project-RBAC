import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { UserInRequest } from '../../common/decorators';
import { CreateCommentReportDto, CreateUserReportDto } from './dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('user-reports')
export class UserReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  async createUserReport(
    @UserInRequest() user: User,
    @Body() body: CreateUserReportDto,
  ) {
    try {
      return await this.reportsService.createUserReport(user.id, body);
    } catch (error) {
      throw error;
    }
  }

  @Post('comment')
  async createCommentReport(
    @UserInRequest() user: User,
    @Body() body: CreateCommentReportDto,
  ) {
    try {
      return await this.reportsService.createCommentReport(user.id, body);
    } catch (error) {
      throw error;
    }
  }
}
