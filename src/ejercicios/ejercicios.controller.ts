import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator.js';
import { EjerciciosService } from './ejercicios.service.js';

@UseGuards(JwtAuthGuard)
@Controller('ejercicios')
export class EjerciciosController {
  constructor(private readonly ejerciciosService: EjerciciosService) { }

  @Get()
  listar() {
    return this.ejerciciosService.listar();
  }

  @Get(':id/referencia')
  referencia(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: { id: string },
    @Query('excluir_sesion') excluirSesion?: string,
  ) {
    return this.ejerciciosService.referencia(id, usuario.id, excluirSesion);
  }

  @Get(':id/historial')
  historial(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: { id: string },
  ) {
    return this.ejerciciosService.historial(id, usuario.id);
  }
}
