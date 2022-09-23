import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasawordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
