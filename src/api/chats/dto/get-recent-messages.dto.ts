import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class GetRecentMessagesDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  skip?: number = 0;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  take?: number = 10;
}
