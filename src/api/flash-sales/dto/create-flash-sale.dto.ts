import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateFlashSaleDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  flashSalePrice: number;

  @IsNumber()
  @IsNotEmpty()
  flashSaleQuantity: number;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  startAt: Date;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  dueAt: Date;
}
