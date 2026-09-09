import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { EjerciciosModule } from './ejercicios/ejercicios.module.js';
import { RutinasModule } from './rutinas/rutinas.module.js';
import { SesionesModule } from './sesiones/sesiones.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      // false en producción: ahí el esquema lo maneja una migración, no el ORM.
      synchronize: process.env.NODE_ENV !== 'production',
      // Neon y la mayoría de los Postgres administrados exigen SSL, y el
      // driver no lo activa solo — rejectUnauthorized:false porque usan
      // certificados de una CA que node no trae preinstalada.
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    }),
    AuthModule,
    EjerciciosModule,
    RutinasModule,
    SesionesModule,
    DashboardModule,
  ],
})
export class AppModule { }