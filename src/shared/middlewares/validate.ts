import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from '../errors/AppError';

type RequestSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

/**
 * Valida body, params e query com zod. Os valores já convertidos/normalizados
 * ficam disponíveis em res.locals (body também é sobrescrito em req.body),
 * porque no Express 5 req.query é somente leitura.
 */
export const validate =
  (schemas: RequestSchemas): RequestHandler =>
  (req, res, next) => {
    const errors: Record<string, unknown> = {};

    for (const key of ['params', 'query', 'body'] as const) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(req[key] ?? {});
      if (result.success) {
        res.locals[key] = result.data;
      } else {
        errors[key] = result.error.flatten().fieldErrors;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new AppError('Dados inválidos', 400, errors);
    }

    if (schemas.body) req.body = res.locals.body;
    next();
  };
