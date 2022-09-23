import { IsOptional, IsString } from 'class-validator';

export class AdminCancelOrderDto {
  @IsString()
  @IsOptional()
  description?: string;
}
