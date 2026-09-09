import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { RegistroDto } from './dto/registro.dto.js';
import { LoginDto } from './dto/login.dto.js';

const REFRESH_TOKEN_DIAS = 30;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    private readonly jwt: JwtService,
  ) {}

  async registro(dto: RegistroDto) {
    const existente = await this.usuarios.findOne({
      where: { email: dto.email },
    });
    if (existente) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }

    const contrasenaHash = await bcrypt.hash(dto.contrasena, 12);
    const usuario = await this.usuarios.save(
      this.usuarios.create({
        nombre: dto.nombre,
        email: dto.email,
        contrasenaHash,
      }),
    );

    return this.emitirTokens(usuario);
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuarios.findOne({
      where: { email: dto.email },
    });
    if (!usuario) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const coincide = await bcrypt.compare(
      dto.contrasena,
      usuario.contrasenaHash,
    );
    if (!coincide) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    return this.emitirTokens(usuario);
  }

  async refrescar(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const registro = await this.refreshTokens.findOne({
      where: { tokenHash },
      relations: { usuario: true },
    });

    if (!registro || registro.revocado || registro.expiraEn < new Date()) {
      throw new UnauthorizedException(
        'Sesión expirada, vuelve a iniciar sesión',
      );
    }

    // Rotación: el token usado queda inservible aunque alguien más lo tenga.
    registro.revocado = true;
    await this.refreshTokens.save(registro);

    return this.emitirTokens(registro.usuario);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.refreshTokens.update({ tokenHash }, { revocado: true });
  }

  private async emitirTokens(usuario: Usuario) {
    const access_token = await this.jwt.signAsync({
      sub: usuario.id,
      email: usuario.email,
    });

    const refreshTokenPlano = crypto.randomBytes(48).toString('hex');
    await this.refreshTokens.save(
      this.refreshTokens.create({
        usuario,
        tokenHash: this.hashToken(refreshTokenPlano),
        expiraEn: new Date(
          Date.now() + REFRESH_TOKEN_DIAS * 24 * 60 * 60 * 1000,
        ),
      }),
    );

    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
      },
      access_token,
      refresh_token: refreshTokenPlano,
    };
  }

  // Igual que la contraseña, el refresh token nunca se guarda en texto plano.
  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
