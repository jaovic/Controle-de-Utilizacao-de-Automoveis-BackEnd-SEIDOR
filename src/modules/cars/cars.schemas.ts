import { z } from 'zod';
import { requiredText } from '../../shared/schemas';

// Aceita o padrão antigo (ABC1234) e o Mercosul (ABC1D23), com ou sem hífen/espaço.
const PLATE_REGEX = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;

const plateSchema = z
  .string({ required_error: 'placa é obrigatória', invalid_type_error: 'placa deve ser texto' })
  .transform((value) => value.replace(/[\s-]/g, '').toUpperCase())
  .refine((value) => PLATE_REGEX.test(value), {
    message: 'placa inválida (formatos aceitos: ABC1234 ou ABC1D23)',
  });

export const createCarSchema = z.object({
  plate: plateSchema,
  color: requiredText('cor', 50),
  brand: requiredText('marca', 50),
});

export const updateCarSchema = createCarSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'informe ao menos um campo para atualizar' });

export const listCarsQuerySchema = z.object({
  color: z.string().trim().min(1).optional(),
  brand: z.string().trim().min(1).optional(),
});

export type CreateCarInput = z.infer<typeof createCarSchema>;
export type UpdateCarInput = z.infer<typeof updateCarSchema>;
export type ListCarsFilters = z.infer<typeof listCarsQuerySchema>;
