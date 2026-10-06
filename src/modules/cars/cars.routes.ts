import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate';
import { idParamSchema } from '../../shared/schemas';
import type { CarsController } from './cars.controller';
import { createCarSchema, listCarsQuerySchema, updateCarSchema } from './cars.schemas';

export function carsRoutes(controller: CarsController) {
  const router = Router();

  router.post('/', validate({ body: createCarSchema }), controller.create);
  router.get('/', validate({ query: listCarsQuerySchema }), controller.list);
  router.get('/:id', validate({ params: idParamSchema }), controller.getById);
  router.put('/:id', validate({ params: idParamSchema, body: updateCarSchema }), controller.update);
  router.delete('/:id', validate({ params: idParamSchema }), controller.delete);

  return router;
}
