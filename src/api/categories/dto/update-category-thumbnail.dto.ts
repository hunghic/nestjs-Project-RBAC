import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UpdateCategoryThumbnailDto {
  @IsNotEmpty()
  @ApiProperty({ type: 'string', format: 'binary' })
  thumbnail: any;
}
