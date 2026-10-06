import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid('id deve ser um UUID válido'),
});

export type IdParam = z.infer<typeof idParamSchema>;

/** String obrigatória, sem espaços nas pontas. */
export const requiredText = (field: string, max = 255) =>
  z
    .string({ required_error: `${field} é obrigatório`, invalid_type_error: `${field} deve ser texto` })
    .trim()
    .min(1, `${field} é obrigatório`)
    .max(max, `${field} deve ter no máximo ${max} caracteres`);
