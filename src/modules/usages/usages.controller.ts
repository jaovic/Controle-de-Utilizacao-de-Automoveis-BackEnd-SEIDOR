import type { Request, Response } from 'express';
import type { IdParam } from '../../shared/schemas';
import type { UsagesService } from './usages.service';
import type { FinishUsageInput, ListUsagesFilters, StartUsageInput } from './usages.schemas';

export class UsagesController {
  constructor(private readonly usagesService: UsagesService) {}

  start = async (req: Request, res: Response) => {
    const usage = await this.usagesService.start(req.body as StartUsageInput);
    res.status(201).json(usage);
  };

  finish = async (req: Request, res: Response) => {
    const { id } = res.locals.params as IdParam;
    const usage = await this.usagesService.finish(id, req.body as FinishUsageInput);
    res.json(usage);
  };

  list = async (_req: Request, res: Response) => {
    res.json(await this.usagesService.list(res.locals.query as ListUsagesFilters));
  };
}
