import { AdminReportsController } from './admin-reports.controller';
import { Module } from '@nestjs/common';
import { SystemReportsController } from './system-reports.controller';
import { UserReportsController } from './user-reports.controller';
import { ReportsService } from './reports.service';

@Module({
  controllers: [
    SystemReportsController,
    UserReportsController,
    AdminReportsController,
  ],
  providers: [ReportsService],
})
export class ReportsModule {}
