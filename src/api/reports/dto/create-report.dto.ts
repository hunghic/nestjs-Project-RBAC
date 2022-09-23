import { ApiProperty } from '@nestjs/swagger';
import { SystemReportType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateSystemReportDto {
  @ApiProperty({ enum: SystemReportType })
  @IsEnum(SystemReportType)
  @IsNotEmpty()
  reportType: SystemReportType;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CreateUserReportDto {
  @IsNumber()
  @IsNotEmpty()
  reporteeId: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CreateCommentReportDto {
  @IsNumber()
  @IsNotEmpty()
  commentId: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}
