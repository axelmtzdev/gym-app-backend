import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rutina } from './entities/rutina.entity.js';
import { RutinaEjercicio } from './entities/rutina-ejercicio.entity.js';
import { Sesion } from '../sesiones/entities/sesion.entity.js';
import { RutinasService } from './rutinas.service.js';
import { RutinasController } from './rutinas.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Rutina, RutinaEjercicio, Sesion])],
  controllers: [RutinasController],
  providers: [RutinasService],
})
export class RutinasModule { }
