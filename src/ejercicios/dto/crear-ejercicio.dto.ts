import { IsIn, IsOptional, IsString } from 'class-validator';

export const GRUPOS_MUSCULARES = [
  'Pecho',
  'Espalda',
  'Hombro',
  'Pierna',
  'Brazo',
  'Core',
  'Otro',
] as const;

export class CrearEjercicioDto {
  @IsString()
  nombre: string;

  @IsIn(GRUPOS_MUSCULARES)
  grupo_muscular: string;

  @IsOptional()
  @IsString()
  equipo?: string;
}
