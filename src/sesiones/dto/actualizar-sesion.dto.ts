import { IsIn, IsOptional, IsString } from 'class-validator';
import { EstadoSesion } from '../entities/sesion.entity.js';

export class ActualizarSesionDto {
  @IsOptional()
  @IsIn([EstadoSesion.COMPLETADA, EstadoSesion.ABANDONADA])
  estado?: EstadoSesion;

  @IsOptional()
  @IsString()
  nota_general?: string;
}
