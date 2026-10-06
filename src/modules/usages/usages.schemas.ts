import { z } from 'zod';
import { requiredText } from '../../shared/schemas';

const optionalDate = (field: string) =>
  z.coerce.date({ invalid_type_error: `${field} deve ser uma data válida (ISO 8601)` }).optional();

export const startUsageSchema = z.object({
  carId: z.string({ required_error: 'carId é obrigatório' }).uuid('carId deve ser um UUID válido'),
  driverId: z.string({ required_error: 'driverId é obrigatório' }).uuid('driverId deve ser um UUID válido'),
  reason: requiredText('motivo', 500),
  startedAt: optionalDate('startedAt'),
});

export const finishUsageSchema = z
  .object({
    endedAt: optionalDate('endedAt'),
  })
  .default({});

export const listUsagesQuerySchema = z.object({
  active: z
    .enum(['true', 'false'], { errorMap: () => ({ message: 'active deve ser true ou false' }) })
    .transform((value) => value === 'true')
    .optional(),
  carId: z.string().uuid('carId deve ser um UUID válido').optional(),
  driverId: z.string().uuid('driverId deve ser um UUID válido').optional(),
});

export type StartUsageInput = z.infer<typeof startUsageSchema>;
export type FinishUsageInput = z.infer<typeof finishUsageSchema>;
export type ListUsagesFilters = z.infer<typeof listUsagesQuerySchema>;
