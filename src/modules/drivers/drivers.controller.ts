import type { Request, Response } from 'express';
import type { IdParam } from '../../shared/schemas';
import type { DriversService } from './drivers.service';
import type { CreateDriverInput, ListDriversFilters, UpdateDriverInput } from './drivers.schemas';

export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  create = async (req: Request, res: Response) => {
    const driver = await this.driversService.create(req.body as CreateDriverInput);
    res.status(201).json(driver);
  };

  update = async (req: Request, res: Response) => {
    const { id } = res.locals.params as IdParam;
    const driver = await this.driversService.update(id, req.body as UpdateDriverInput);
    res.json(driver);
  };

  delete = async (_req: Request, res: Response) => {
    const { id } = res.locals.params as IdParam;
    await this.driversService.delete(id);
    res.status(204).send();
  };

  getById = async (_req: Request, res: Response) => {
    const { id } = res.locals.params as IdParam;
    res.json(await this.driversService.getById(id));
  };

  list = async (_req: Request, res: Response) => {
    res.json(await this.driversService.list(res.locals.query as ListDriversFilters));
  };
}
