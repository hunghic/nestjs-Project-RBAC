import { ApiProperty } from '@nestjs/swagger';
import { CategoryStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

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

  @ApiProperty({ type: 'string', format: 'binary' })
  @IsOptional()
  thumbnail?: any;
}
