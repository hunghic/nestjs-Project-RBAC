import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';

export enum CodeOrigin {
  QR = 'qr',
  Email = 'email',
}

export class OtpCodeDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;

  @IsEnum(CodeOrigin)
  @IsNotEmpty()
  from: CodeOrigin;
}
