import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ImportProductDto {
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class GetFormImportDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  productIds?: number[];
}

export class FormImportDto {
  @IsNotEmpty()
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
