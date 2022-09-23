import { ApiProperty } from '@nestjs/swagger';
import { CategoryStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsString()
  @IsOptional()
  fullDescription?: string;

  @ApiProperty({ enum: CategoryStatus })
  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus;
}
