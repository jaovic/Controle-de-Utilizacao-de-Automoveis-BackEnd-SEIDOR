import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate';
import { idParamSchema } from '../../shared/schemas';
import type { DriversController } from './drivers.controller';
import { createDriverSchema, listDriversQuerySchema, updateDriverSchema } from './drivers.schemas';

export function driversRoutes(controller: DriversController) {
  const router = Router();

  router.post('/', validate({ body: createDriverSchema }), controller.create);
  router.get('/', validate({ query: listDriversQuerySchema }), controller.list);
  router.get('/:id', validate({ params: idParamSchema }), controller.getById);
  router.put('/:id', validate({ params: idParamSchema, body: updateDriverSchema }), controller.update);
  router.delete('/:id', validate({ params: idParamSchema }), controller.delete);

  return router;
}
