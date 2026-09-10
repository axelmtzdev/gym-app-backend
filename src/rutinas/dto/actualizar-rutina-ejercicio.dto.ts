import { IsInt, IsOptional, Min } from 'class-validator';

export class ActualizarRutinaEjercicioDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  orden?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  series_objetivo?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  reps_objetivo?: number;
}
