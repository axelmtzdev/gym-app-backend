import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegistroDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  contrasena: string;
}
