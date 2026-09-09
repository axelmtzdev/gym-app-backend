import { IsUUID } from 'class-validator';

export class CrearSesionDto {
  @IsUUID()
  rutina_id: string;
}
