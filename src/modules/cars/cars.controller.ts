import type { Request, Response } from 'express';
import type { IdParam } from '../../shared/schemas';
import type { CarsService } from './cars.service';
import type { CreateCarInput, ListCarsFilters, UpdateCarInput } from './cars.schemas';

export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  create = async (req: Request, res: Response) => {
    const car = await this.carsService.create(req.body as CreateCarInput);
    res.status(201).json(car);
  };

  update = async (req: Request, res: Response) => {
    const { id } = res.locals.params as IdParam;
    const car = await this.carsService.update(id, req.body as UpdateCarInput);
    res.json(car);
  };

  delete = async (_req: Request, res: Response) => {
    const { id } = res.locals.params as IdParam;
    await this.carsService.delete(id);
    res.status(204).send();
  };

  getById = async (_req: Request, res: Response) => {
    const { id } = res.locals.params as IdParam;
    res.json(await this.carsService.getById(id));
  };

  list = async (_req: Request, res: Response) => {
    res.json(await this.carsService.list(res.locals.query as ListCarsFilters));
  };
}
