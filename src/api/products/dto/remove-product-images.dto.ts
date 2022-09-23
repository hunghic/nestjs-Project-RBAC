import { ArrayNotEmpty, IsArray, IsNumber } from 'class-validator';

export class RemoveProductImagesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  productImageIds: number[];
}
