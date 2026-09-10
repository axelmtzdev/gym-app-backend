import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator.js';
import { EjerciciosService } from './ejercicios.service.js';
import { CrearEjercicioDto } from './dto/crear-ejercicio.dto.js';
import { ActualizarEjercicioDto } from './dto/actualizar-ejercicio.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('ejercicios')
export class EjerciciosController {
  constructor(private readonly ejerciciosService: EjerciciosService) { }

  @Get()
  listar(@Query('grupos') grupos?: string) {
    return this.ejerciciosService.listar(
      grupos ? grupos.split(',').filter(Boolean) : undefined,
    );
  }

  @Post()
  crear(@Body() dto: CrearEjercicioDto) {
    return this.ejerciciosService.crear(dto);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarEjercicioDto,
  ) {
    return this.ejerciciosService.actualizar(id, dto);
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
