import { ApiProperty } from '@nestjs/swagger';
import { VoucherUnit } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUppercase,
  IsAlphanumeric,
  NotContains,
} from 'class-validator';

export class CreateGeneralVoucherDto {
  @IsAlphanumeric()
  @NotContains(' ')
  @IsOptional()
  @IsUppercase()
  @Transform(({ value }) => value.toUpperCase())
  customCode?: string;

  @IsNumber()
  @IsNotEmpty()
  valueDiscount: number;

  @ApiProperty({ enum: VoucherUnit })
  @IsEnum(VoucherUnit)
  @IsOptional()
  unit?: VoucherUnit;

  @IsNumber()
  @IsOptional()
  maxDiscount?: number;

  @IsNumber()
  @IsOptional()
  minOrderPrice?: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  startAt: Date;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  dueAt: Date;
}

export class CreatePersonalVoucherDto {
  @IsString()
  @IsOptional()
  @IsUppercase()
  @Transform(({ value }) => value.toUpperCase())
  customCode?: string;

  @IsNumber()
  @IsNotEmpty()
  valueDiscount: number;

  @ApiProperty({ enum: VoucherUnit })
  @IsEnum(VoucherUnit)
  @IsOptional()
  unit?: VoucherUnit;

  @IsNumber()
  @IsOptional()
  maxDiscount?: number;

  @IsNumber()
  @IsOptional()
  minOrderPrice?: number;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  startAt: Date;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  dueAt: Date;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  voucherUserIds: number[];
}
