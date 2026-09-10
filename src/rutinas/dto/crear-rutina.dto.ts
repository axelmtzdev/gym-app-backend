import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { GRUPOS_MUSCULARES } from '../../ejercicios/dto/crear-ejercicio.dto.js';

export class CrearRutinaDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsIn(GRUPOS_MUSCULARES, { each: true })
  grupos: string[];
}
