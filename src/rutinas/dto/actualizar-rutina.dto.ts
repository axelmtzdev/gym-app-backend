import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ActualizarRutinaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
