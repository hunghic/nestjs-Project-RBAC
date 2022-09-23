import { ApiProperty } from '@nestjs/swagger';
import { AddressType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsOptional()
  receiverName?: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  addressDetail: string;

  @ApiProperty({ enum: AddressType })
  @IsEnum(AddressType)
  @IsOptional()
  addressType?: AddressType;
}
