import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator.js';
import { RutinasService } from './rutinas.service.js';
import { CrearRutinaDto } from './dto/crear-rutina.dto.js';
import { ActualizarRutinaDto } from './dto/actualizar-rutina.dto.js';
import { CrearRutinaEjercicioDto } from './dto/crear-rutina-ejercicio.dto.js';
import { ActualizarRutinaEjercicioDto } from './dto/actualizar-rutina-ejercicio.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('rutinas')
export class RutinasController {
  constructor(private readonly rutinasService: RutinasService) { }

  @Get()
  listar(@UsuarioActual() usuario: { id: string }) {
    return this.rutinasService.listar(usuario.id);
  }

  @Post()
  crear(
    @Body() dto: CrearRutinaDto,
    @UsuarioActual() usuario: { id: string },
  ) {
    return this.rutinasService.crear(dto, usuario.id);
  }

  @Get(':id')
  obtener(@Param('id') id: string, @UsuarioActual() usuario: { id: string }) {
    return this.rutinasService.obtener(id, usuario.id);
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarRutinaDto,
    @UsuarioActual() usuario: { id: string },
  ) {
    return this.rutinasService.actualizar(id, dto, usuario.id);
  }

  @Post(':id/ejercicios')
  agregarEjercicio(
    @Param('id') id: string,
    @Body() dto: CrearRutinaEjercicioDto,
    @UsuarioActual() usuario: { id: string },
  ) {
    return this.rutinasService.agregarEjercicio(id, dto, usuario.id);
  }

  @Patch(':id/ejercicios/:rutinaEjercicioId')
  actualizarEjercicio(
    @Param('id') id: string,
    @Param('rutinaEjercicioId', ParseIntPipe) rutinaEjercicioId: number,
    @Body() dto: ActualizarRutinaEjercicioDto,
    @UsuarioActual() usuario: { id: string },
  ) {
    return this.rutinasService.actualizarEjercicio(
      id,
      rutinaEjercicioId,
      dto,
      usuario.id,
    );
  }

  @Delete(':id/ejercicios/:rutinaEjercicioId')
  @HttpCode(204)
  eliminarEjercicio(
    @Param('id') id: string,
    @Param('rutinaEjercicioId', ParseIntPipe) rutinaEjercicioId: number,
    @UsuarioActual() usuario: { id: string },
  ) {
    return this.rutinasService.eliminarEjercicio(
      id,
      rutinaEjercicioId,
      usuario.id,
    );
  }
}
