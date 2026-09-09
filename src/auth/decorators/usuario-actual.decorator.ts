import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Extrae el usuario ya validado por JwtAuthGuard (request.user) — así
// ningún controller necesita (ni puede) leer un usuario_id ajeno.
export const UsuarioActual = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);