import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sesion } from './entities/sesion.entity.js';
import { Serie } from './entities/serie.entity.js';
import { SesionesService } from './sesiones.service.js';
import { SesionesController } from './sesiones.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Sesion, Serie])],
  controllers: [SesionesController],
  providers: [SesionesService],
})
export class SesionesModule { }
