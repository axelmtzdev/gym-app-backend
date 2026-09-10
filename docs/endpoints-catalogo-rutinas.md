# Endpoints nuevos — catálogo de ejercicios y gestión de rutinas

> Todas las rutas requieren header `Authorization: Bearer <access_token>` (JWT obtenido en `POST /auth/login`), salvo que se indique lo contrario. El `usuario_id` siempre sale del token, nunca del body ni de la URL.

## Ejercicios

### `POST /ejercicios`
Crea un ejercicio en el catálogo global.

**Body**
```json
{
  "nombre": "Press banca",
  "grupo_muscular": "Pecho",
  "equipo": "Barra"
}
```
- `nombre`: string, requerido.
- `grupo_muscular`: string, requerido. Solo acepta: `Pecho, Espalda, Hombro, Pierna, Brazo, Core, Otro`.
- `equipo`: string, opcional.

**Respuesta `201`**
```json
{
  "id": 1,
  "nombre": "Press banca",
  "grupo_muscular": "Pecho",
  "equipo": "Barra",
  "activo": true,
  "creado_en": "2026-09-10T12:00:00.000Z"
}
```

**Errores**
- `400` — `grupo_muscular` fuera de la lista fija, o falta `nombre`.
- `409` — ya existe un ejercicio con ese `nombre`.

---

### `PATCH /ejercicios/:id`
Actualiza un ejercicio existente. Todos los campos son opcionales; solo se aplican los que vengan en el body. Desactivar un ejercicio (para que deje de aparecer en `GET /ejercicios`) se hace con `activo: false`, no se borra nunca.

**Body**
```json
{
  "nombre": "Press banca inclinado",
  "grupo_muscular": "Pecho",
  "equipo": "Mancuernas",
  "activo": false
}
```

**Respuesta `200`** — el ejercicio actualizado (misma forma que el `POST`).

**Errores**
- `400` — `grupo_muscular` fuera de la lista fija.
- `404` — no existe un ejercicio con ese `id`.
- `409` — el nuevo `nombre` ya lo tiene otro ejercicio.

---

### `GET /ejercicios?grupos=Pecho,Hombro`
Lista el catálogo. Sin filtro, devuelve todo el catálogo con `activo = true`. Con `?grupos=`, además filtra por esos grupos musculares exactos (separados por coma).

**Respuesta `200`**
```json
[
  { "id": 1, "nombre": "Press banca", "grupo_muscular": "Pecho", "equipo": "Barra", "activo": true, "creado_en": "..." }
]
```

---

## Rutinas

### `POST /rutinas`
Crea una rutina junto con sus grupos musculares. Es una operación transaccional: si falla la inserción de los grupos, la rutina no queda creada.

**Body**
```json
{
  "nombre": "Empuje",
  "descripcion": "Pecho, hombro y tríceps",
  "grupos": ["Pecho", "Hombro", "Brazo"]
}
```
- `nombre`: string, requerido.
- `descripcion`: string, opcional.
- `grupos`: array de 1 a 3 strings, requerido. Cada valor debe estar en la lista fija (`Pecho, Espalda, Hombro, Pierna, Brazo, Core, Otro`).

**Respuesta `201`**
```json
{
  "id": "uuid",
  "nombre": "Empuje",
  "descripcion": "Pecho, hombro y tríceps",
  "activa": true,
  "grupos": ["Pecho", "Hombro", "Brazo"]
}
```

**Errores**
- `400` — `grupos` vacío, con más de 3 elementos, o con un valor fuera de la lista fija.

---

### `PATCH /rutinas/:id`
Actualiza nombre, descripción, estado activo y/o grupos musculares de una rutina propia.

**Body**
```json
{
  "nombre": "Empuje (actualizado)",
  "descripcion": "string",
  "activa": false,
  "grupos": ["Pecho", "Hombro", "Brazo"]
}
```
Todos los campos son opcionales.
- Si `grupos` viene en el body, reemplaza por completo los grupos musculares de la rutina (borra los que tenía e inserta los nuevos, en una transacción). Misma validación que en `POST /rutinas`: array de 1 a 3 elementos, cada uno dentro de la lista fija.
- Si `grupos` no viene, esa tabla no se toca.
- **Nunca** toca `rutina_ejercicios`: si se quita un grupo que ya tenía un ejercicio asociado (p. ej. quitar "Pierna" con Sentadilla en el plan), ese ejercicio se queda en la rutina sin limpieza automática — hay que quitarlo a mano con `DELETE /rutinas/:id/ejercicios/:id` si ya no aplica.

**Respuesta `200`** — la rutina actualizada. Ahora **siempre** incluye `grupos: string[]`, se hayan mandado o no en el body.
```json
{ "id": "uuid", "nombre": "string", "descripcion": "string", "activa": true, "grupos": ["Pecho", "Hombro", "Brazo"] }
```

**Errores**
- `400` — `grupos` vacío, con más de 3 elementos, o con un valor fuera de la lista fija.
- `404` — la rutina no existe o no pertenece al usuario autenticado.

---

### `GET /rutinas`
Lista las rutinas del usuario autenticado. Cada rutina incluye ahora `grupos: string[]`.

**Respuesta `200`**
```json
[
  {
    "id": "uuid",
    "nombre": "Empuje",
    "descripcion": "Pecho, hombro y tríceps",
    "activa": true,
    "creado_en": "...",
    "grupos": ["Pecho", "Hombro", "Brazo"]
  }
]
```

---

### `GET /rutinas/:id`
Detalle de una rutina propia. Incluye `grupos: string[]` además de lo que ya devolvía (ejercicios del plan, entrenamientos de esta semana, etc).

**Respuesta `200`**
```json
{
  "id": "uuid",
  "nombre": "Empuje",
  "descripcion": "Pecho, hombro y tríceps",
  "entrenamientos_esta_semana": 2,
  "grupos": ["Pecho", "Hombro", "Brazo"],
  "ejercicios": [
    { "ejercicio_id": 1, "nombre": "Press banca", "orden": 1, "series_objetivo": 4, "reps_objetivo": 8 }
  ]
}
```

**Errores**
- `404` — la rutina no existe o no pertenece al usuario autenticado.

---

### `POST /rutinas/:id/ejercicios`
Agrega un ejercicio al plan de la rutina.

**Body**
```json
{
  "ejercicio_id": 1,
  "orden": 1,
  "series_objetivo": 4,
  "reps_objetivo": 8
}
```

**Respuesta `201`** — el renglón de `rutina_ejercicios` creado.

**Errores**
- `404` — la rutina no existe o no pertenece al usuario autenticado.
- `409` — ese ejercicio ya está en el plan de la rutina.

---

### `PATCH /rutinas/:id/ejercicios/:rutinaEjercicioId`
Actualiza orden, series objetivo y/o reps objetivo de un ejercicio dentro del plan.

**Body**
```json
{
  "orden": 2,
  "series_objetivo": 3,
  "reps_objetivo": 10
}
```
Todos los campos son opcionales.

**Respuesta `200`** — el renglón actualizado.

**Errores**
- `404` — la rutina no existe/no es del usuario, o ese renglón no existe en esa rutina.

---

### `DELETE /rutinas/:id/ejercicios/:rutinaEjercicioId`
Quita un ejercicio del plan de la rutina. Es un borrado real de la tabla puente `rutina_ejercicios` — no afecta el historial de series ya registradas (eso vive en `series`).

**Respuesta `204`** — sin body.

**Errores**
- `404` — la rutina no existe/no es del usuario, o ese renglón no existe en esa rutina.

---

## Notas generales

- `ejercicios` es un catálogo global: sus endpoints no verifican dueño.
- Todos los endpoints de `rutinas` (y sus sub-recursos) verifican que la rutina pertenezca al usuario del JWT antes de leer o escribir; si no es así, responden `404` (no `403`) para no filtrar la existencia de rutinas ajenas.
- Ver [requests.http](../requests.http) en la raíz del repo para ejemplos ejecutables (extensión REST Client de VS Code) de cada uno de estos endpoints, incluyendo los casos de error.
