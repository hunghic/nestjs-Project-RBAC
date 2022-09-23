import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum ProductSortBy {
  name = 'name',
  listedPrice = 'listedPrice',
  salePrice = 'salePrice',
  status = 'status',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
}

export enum OrderSort {
  asc = 'asc',
  desc = 'desc',
}

export class GetListProductsDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 10;

  @ApiProperty({ enum: ProductSortBy })
  @IsEnum(ProductSortBy)
  @IsOptional()
  sortBy?: ProductSortBy;

  @ApiProperty({ enum: OrderSort })
  @IsEnum(OrderSort)
  @IsNotEmpty()
  orderSort?: OrderSort = OrderSort.asc;
}
