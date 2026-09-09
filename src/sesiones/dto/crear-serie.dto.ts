import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CrearSerieDto {
  @IsInt()
  ejercicio_id: number;

  @IsInt()
  @Min(1)
  numero_serie: number;

  @IsNumber()
  @Min(0)
  peso_kg: number;

  @IsInt()
  @Min(1)
  repeticiones: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rpe?: number;

  @IsOptional()
  @IsString()
  nota?: string;
}
