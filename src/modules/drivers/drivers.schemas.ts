import { z } from 'zod';
import { requiredText } from '../../shared/schemas';

export const createDriverSchema = z.object({
  name: requiredText('nome', 120),
});

export const updateDriverSchema = createDriverSchema;

export const listDriversQuerySchema = z.object({
  name: z.string().trim().min(1).optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type ListDriversFilters = z.infer<typeof listDriversQuerySchema>;
