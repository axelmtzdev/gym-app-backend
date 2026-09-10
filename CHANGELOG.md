# Changelog — gym-app-backend

> Documento de contexto para retomar el proyecto en una nueva sesión de trabajo.
> Última actualización: 2026-09-09.

## Resumen del proyecto

Backend de una app de gimnasio/entrenamiento construido con **NestJS** (v12) sobre **TypeORM** + **PostgreSQL** (hosteado en **Neon**). Usa ESM nativo (`"type": "module"` en `package.json`), autenticación JWT con refresh tokens, y expone módulos para autenticación, ejercicios, rutinas, sesiones de entrenamiento y un dashboard de resumen.

### Stack técnico

- **Framework:** NestJS 12 (Node ESM, sin CommonJS)
- **ORM / DB:** TypeORM 1.1.1 + PostgreSQL (Neon, requiere SSL)
- **Auth:** `@nestjs/jwt` + `@nestjs/passport` (estrategia `passport-jwt`), refresh tokens propios en tabla `refresh_tokens`, contraseñas con `bcrypt`
- **Validación:** `class-validator` / `class-transformer`
- **Testing:** Vitest (unit y e2e, config separada `vitest.config.e2e.ts`)
- **Lint/format:** `oxlint` + `prettier`
- **Config:** `@nestjs/config` (variables de entorno, ver `env.example`)

### Módulos (`src/`)

- **auth/** — registro, login, refresh y logout. Guard `JwtAuthGuard` (envuelve `AuthGuard('jwt')`), decorator `@UsuarioActual()` para extraer el usuario del request, entidad `RefreshToken`.
- **usuarios/** — entidad `Usuario` (sin módulo/controller propio aún; se consume desde auth).
- **ejercicios/** — catálogo de ejercicios (listar, referencia de una ejecución previa, historial por ejercicio).
- **rutinas/** — rutinas de entrenamiento del usuario (listar, obtener detalle) y su tabla puente `rutina_ejercicios` (orden, series/reps objetivo).
- **sesiones/** — sesiones de entrenamiento en vivo: crear, actualizar, ver resumen, registrar series (`series` entity).
- **dashboard/** — endpoint único que agrega datos de resumen para el usuario autenticado.

### Endpoints actuales

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/auth/registro` | No | Alta de usuario |
| POST | `/auth/login` | No | Login, devuelve tokens |
| POST | `/auth/refresh` | No | Renueva access token con refresh token |
| POST | `/auth/logout` | JWT | Revoca refresh token |
| GET | `/ejercicios` | JWT | Lista catálogo de ejercicios |
| GET | `/ejercicios/:id/referencia` | JWT | Última ejecución del ejercicio (excluye sesión opcional vía query `excluir_sesion`) |
| GET | `/ejercicios/:id/historial` | JWT | Historial del ejercicio para el usuario |
| GET | `/rutinas` | JWT | Lista rutinas del usuario |
| GET | `/rutinas/:id` | JWT | Detalle de una rutina |
| POST | `/sesiones` | JWT | Crea una sesión de entrenamiento |
| PATCH | `/sesiones/:id` | JWT | Actualiza una sesión (p.ej. finalizarla) |
| GET | `/sesiones/:id/resumen` | JWT | Resumen de una sesión |
| POST | `/sesiones/:id/series` | JWT | Registra una serie dentro de la sesión |
| GET | `/dashboard` | JWT | Resumen agregado para el usuario autenticado |

## Historial de commits

### `82d747f` — Backend inicial (2026-09-09)
Commit fundacional: estructura completa de NestJS con los 5 módulos (auth, ejercicios, rutinas, sesiones, dashboard), entidades TypeORM para las 7 tablas, DTOs con class-validator, configuración de proyecto (oxlint, prettier, vitest, tsconfig), y README por defecto de NestJS.

### `dbd5f66` — Implement code changes to enhance functionality and improve performance
Commit trivial: solo agrega `tsconfig.build.tsbuildinfo` (artefacto de build).

### `ef51238` — Fix ESM circular dependency crash between entities on startup
**Problema:** bajo el loader ESM de Node, las entidades que se importaban entre sí (Usuario/Sesion, Rutina/RutinaEjercicio, Sesion/Serie, etc.) lanzaban `Cannot access 'X' before initialization` porque `emitDecoratorMetadata` emitía una referencia directa a la clase en tiempo de decoración.
**Fix:** envolver los tipos de propiedades de relación en `Relation<T>` para evitar la referencia directa a la clase.
**Archivos:** las 7 entidades (`refresh-token`, `ejercicio`, `rutina-ejercicio`, `rutina`, `serie`, `sesion`, `usuario`).

### `b361939` — Register RutinaEjercicio entity with TypeORM
**Problema:** `autoLoadEntities` solo detecta entidades pasadas explícitamente a `forFeature()` de algún módulo; `RutinaEjercicio` nunca se registró en ninguno, por lo que TypeORM no podía resolver la relación inversa `Ejercicio.rutinaEjercicios` y fallaba en `DataSource.buildMetadatas`.
**Fix:** registrar `RutinaEjercicio` en `rutinas.module.ts`.

### `5de3cb7` — Fix DI: import AuthModule wherever JwtAuthGuard is used
**Problema:** `JwtAuthGuard` envuelve `AuthGuard('jwt')`, que necesita el provider `AuthModuleOptions` de `PassportModule` en el mismo contexto de módulo. Los módulos `Ejercicios`, `Sesiones`, `Rutinas` y `Dashboard` usaban el guard en sus controllers sin importar `AuthModule`/`PassportModule`, por lo que Nest fallaba al resolver las dependencias del guard al arrancar.
**Fix:** importar `AuthModule` en esos 4 módulos.

### `47d16c6` — Fix AuthModuleOptions DI failure: use PassportModule.register()
**Problema:** un `PassportModule` importado "a secas" (sin `.register()`) nunca provee el token `AuthModuleOptions`. `AuthGuard('jwt')` inyecta ese token con `@Optional()`, pero al no existir ningún provider para él en todo el árbol de módulos, Nest seguía lanzando `UnknownDependenciesException` al instanciar `JwtAuthGuard`, incluso dentro del propio `AuthModule`.
**Fix:** usar `PassportModule.register({ defaultStrategy: 'jwt' })` (o equivalente) en lugar de `PassportModule` sin configurar.

> **Nota:** las últimas 4 correcciones fueron todas errores de arranque en cadena relacionados con DI de NestJS/TypeORM al pasar a ESM — vale la pena tenerlos presentes si se agregan nuevos módulos o entidades con relaciones cruzadas: cualquier módulo nuevo que use `JwtAuthGuard` debe importar `AuthModule`, y cualquier entidad nueva con relaciones debe registrarse explícitamente vía `forFeature()`.

## Esquema de base de datos (PostgreSQL / Neon)

Capturado desde producción el 2026-09-09. 7 tablas en total.

### `usuarios`
| Columna | Tipo | Nullable |
|---|---|---|
| id | uuid | NO |
| nombre | varchar | NO |
| email | varchar | NO |
| contrasena_hash | varchar | NO |
| creado_en | timestamptz | NO |

### `refresh_tokens`
| Columna | Tipo | Nullable |
|---|---|---|
| id | uuid | NO |
| usuario_id | uuid | NO |
| token_hash | varchar | NO |
| creado_en | timestamptz | NO |
| expira_en | timestamptz | NO |
| revocado | boolean | NO |

### `ejercicios`
| Columna | Tipo | Nullable |
|---|---|---|
| id | integer | NO |
| nombre | varchar | NO |
| grupo_muscular | varchar | NO |
| equipo | varchar | YES |
| creado_en | timestamptz | NO |

### `rutinas`
| Columna | Tipo | Nullable |
|---|---|---|
| id | uuid | NO |
| usuario_id | uuid | NO |
| nombre | varchar | NO |
| descripcion | varchar | YES |
| activa | boolean | NO |
| creado_en | timestamptz | NO |

### `rutina_ejercicios`
| Columna | Tipo | Nullable |
|---|---|---|
| id | integer | NO |
| rutina_id | uuid | NO |
| ejercicio_id | integer | NO |
| orden | smallint | NO |
| series_objetivo | smallint | NO |
| reps_objetivo | smallint | NO |

### `sesiones`
| Columna | Tipo | Nullable |
|---|---|---|
| id | uuid | NO |
| usuario_id | uuid | NO |
| rutina_id | uuid | YES |
| iniciada_en | timestamptz | NO |
| finalizada_en | timestamptz | YES |
| nota_general | text | YES |
| estado | varchar | NO |

### `series`
| Columna | Tipo | Nullable |
|---|---|---|
| id | bigint | NO |
| sesion_id | uuid | NO |
| ejercicio_id | integer | NO |
| numero_serie | smallint | NO |
| peso_kg | numeric | NO |
| repeticiones | smallint | NO |
| rpe | numeric | YES |
| nota | text | YES |
| registrada_en | timestamptz | NO |

### Relaciones (inferidas de FKs por nombre + entidades TypeORM)

```
usuarios (1) ──< refresh_tokens
usuarios (1) ──< rutinas
usuarios (1) ──< sesiones
rutinas (1) ──< rutina_ejercicios >── (1) ejercicios
rutinas (1) ──< sesiones (opcional, rutina_id nullable: sesión libre sin rutina)
sesiones (1) ──< series >── (1) ejercicios
```

## Cómo mantener este archivo

Cada vez que se cierre un cambio importante (nueva feature, fix estructural, migración de esquema), agregar una entrada nueva arriba del historial de commits con: qué cambió, por qué, y qué archivos toca. Si la estructura de la base de datos cambia, reemplazar la sección "Esquema de base de datos" completa con el nuevo export.
