import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateGeneralNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  attachments?: string;
}

export class CreateSpecificNotificationDto extends CreateGeneralNotificationDto {
  @ArrayNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  userIds: number[];
}
