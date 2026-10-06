import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate';
import { idParamSchema } from '../../shared/schemas';
import type { UsagesController } from './usages.controller';
import { finishUsageSchema, listUsagesQuerySchema, startUsageSchema } from './usages.schemas';

export function usagesRoutes(controller: UsagesController) {
  const router = Router();

  router.post('/', validate({ body: startUsageSchema }), controller.start);
  router.get('/', validate({ query: listUsagesQuerySchema }), controller.list);
  router.patch('/:id/finish', validate({ params: idParamSchema, body: finishUsageSchema }), controller.finish);

  return router;
}
