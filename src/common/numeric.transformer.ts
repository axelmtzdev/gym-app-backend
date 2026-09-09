import { ValueTransformer } from 'typeorm';

// Postgres numeric/decimal viaja como string en el driver de pg, para no
// perder precisión. TypeORM no lo convierte solo — sin este transformer,
// peso_kg y rpe llegarían como "80.00" en vez de 80.
export const numericTransformer: ValueTransformer = {
    to: (value?: number | null) => value,
    from: (value?: string | null) =>
        value === null || value === undefined ? value : parseFloat(value),
};