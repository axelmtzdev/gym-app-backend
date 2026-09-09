import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator.js';
import { SesionesService } from './sesiones.service.js';
import { CrearSesionDto } from './dto/crear-sesion.dto.js';
import { ActualizarSesionDto } from './dto/actualizar-sesion.dto.js';
import { CrearSerieDto } from './dto/crear-serie.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('sesiones')
export class SesionesController {
  constructor(private readonly sesionesService: SesionesService) { }

  @Post()
  crear(
    @Body() dto: CrearSesionDto,
    @UsuarioActual() usuario: { id: string },
  ) {
    return this.sesionesService.crear(dto, usuario.id);
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarSesionDto,
    @UsuarioActual() usuario: { id: string },
  ) {
    return this.sesionesService.actualizar(id, dto, usuario.id);
  }

  @Get(':id/resumen')
  resumen(@Param('id') id: string, @UsuarioActual() usuario: { id: string }) {
    return this.sesionesService.resumen(id, usuario.id);
  }

  @Post(':id/series')
  registrarSerie(
    @Param('id') id: string,
    @Body() dto: CrearSerieDto,
    @UsuarioActual() usuario: { id: string },
  ) {
    return this.sesionesService.registrarSerie(id, dto, usuario.id);
  }
}
