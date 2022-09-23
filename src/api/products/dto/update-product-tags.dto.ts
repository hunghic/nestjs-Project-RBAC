import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class UpdateProductTagsDto {
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  tags: string[];
}
