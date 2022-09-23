import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class RemoveProductAttributesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  attributes: string[];
}
