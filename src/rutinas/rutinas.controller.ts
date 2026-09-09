import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UsuarioActual } from '../auth/decorators/usuario-actual.decorator.js';
import { RutinasService } from './rutinas.service.js';

@UseGuards(JwtAuthGuard)
@Controller('rutinas')
export class RutinasController {
  constructor(private readonly rutinasService: RutinasService) { }

  @Get()
  listar(@UsuarioActual() usuario: { id: string }) {
    return this.rutinasService.listar(usuario.id);
  }

  @Get(':id')
  obtener(@Param('id') id: string, @UsuarioActual() usuario: { id: string }) {
    return this.rutinasService.obtener(id, usuario.id);
  }
}
