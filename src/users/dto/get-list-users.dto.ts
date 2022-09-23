import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetListUsersDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  skip?: number = 0;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  take?: number = 10;
}
