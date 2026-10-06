import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../errors/AppError';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { message: `Rota ${req.method} ${req.path} não encontrada` } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { message: err.message, details: err.details } });
    return;
  }

  // JSON malformado no body
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { message: 'JSON inválido no corpo da requisição' } });
    return;
  }

  // Violações de constraint que escaparam das validações dos services
  // (ex.: duas requisições simultâneas tentando usar o mesmo carro).
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: { message: 'Conflito: registro viola uma restrição de unicidade' } });
      return;
    }
    if (err.code === 'P2003') {
      res.status(409).json({ error: { message: 'Conflito: registro possui vínculos com outros registros' } });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: { message: 'Registro não encontrado' } });
      return;
    }
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Erro interno do servidor' } });
};
