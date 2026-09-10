import { IsInt, Min } from 'class-validator';

export class CrearRutinaEjercicioDto {
  @IsInt()
  ejercicio_id: number;

  @IsInt()
  @Min(1)
  orden: number;

  @IsInt()
  @Min(1)
  series_objetivo: number;

  @IsInt()
  @Min(1)
  reps_objetivo: number;
}
