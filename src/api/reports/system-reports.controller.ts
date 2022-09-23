import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { UserInRequest } from '../../common/decorators';
import { CreateSystemReportDto } from './dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('system-reports')
export class SystemReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  async createSystemReport(
    @UserInRequest() user: User,
    @Body() body: CreateSystemReportDto,
  ) {
    try {
      return await this.reportsService.createSystemReport(user.id, body);
    } catch (error) {
      throw error;
    }
  }
}
