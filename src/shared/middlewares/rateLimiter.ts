import { rateLimit } from 'express-rate-limit';

export type RateLimitOptions = {
  /** Janela de tempo em milissegundos */
  windowMs: number;
  /** Máximo de requisições por IP dentro da janela */
  max: number;
};

/**
 * Limita a quantidade de requisições por IP (contador em memória, suficiente para uma instância).
 * Ao exceder, responde 429 no mesmo formato de erro do restante da API,
 * com os headers padrão RateLimit-* e Retry-After.
 */
export const createRateLimiter = ({ windowMs, max }: RateLimitOptions) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res, _next, options) => {
      res.status(options.statusCode).json({
        error: { message: 'Muitas requisições. Tente novamente em instantes.' },
      });
    },
  });
