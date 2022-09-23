import { ApiProperty } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsString()
  @IsOptional()
  fullDescription?: string;

  @ApiProperty({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiProperty({ type: 'string', format: 'binary' })
  @IsOptional()
  thumbnail?: any;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  listedPrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  salePrice?: number;
}
