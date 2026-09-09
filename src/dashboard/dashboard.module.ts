import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sesion } from '../sesiones/entities/sesion.entity.js';
import { Serie } from '../sesiones/entities/serie.entity.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardController } from './dashboard.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Sesion, Serie])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule { }
