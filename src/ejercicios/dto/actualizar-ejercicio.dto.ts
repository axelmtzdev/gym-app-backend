import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { GRUPOS_MUSCULARES } from './crear-ejercicio.dto.js';

export class ActualizarEjercicioDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsIn(GRUPOS_MUSCULARES)
  grupo_muscular?: string;

  @IsOptional()
  @IsString()
  equipo?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
