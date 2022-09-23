import { ApiProperty } from '@nestjs/swagger';
import { AddressType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateAddressDto {
  @IsString()
  @IsOptional()
  receiverName?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  addressDetail?: string;

  @ApiProperty({ enum: AddressType })
  @IsEnum(AddressType)
  @IsOptional()
  addressType?: AddressType;
}
