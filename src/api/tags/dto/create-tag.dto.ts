import { IsNotEmpty, IsString, MaxLength, IsLowercase } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @IsLowercase()
  @MaxLength(50)
  @Transform(({ value }) => value.toLowerCase())
  tagName: string;
}
