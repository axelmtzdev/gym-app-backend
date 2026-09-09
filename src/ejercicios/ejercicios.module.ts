import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ejercicio } from './entities/ejercicio.entity.js';
import { Serie } from '../sesiones/entities/serie.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { EjerciciosService } from './ejercicios.service.js';
import { EjerciciosController } from './ejercicios.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Ejercicio, Serie]), AuthModule],
  controllers: [EjerciciosController],
  providers: [EjerciciosService],
})
export class EjerciciosModule { }
