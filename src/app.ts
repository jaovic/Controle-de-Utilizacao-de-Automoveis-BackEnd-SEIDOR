import type { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './docs/openapi';
import { CarsController } from './modules/cars/cars.controller';
import { PrismaCarsRepository } from './modules/cars/cars.repository';
import { carsRoutes } from './modules/cars/cars.routes';
import { CarsService } from './modules/cars/cars.service';
import { DriversController } from './modules/drivers/drivers.controller';
import { PrismaDriversRepository } from './modules/drivers/drivers.repository';
import { driversRoutes } from './modules/drivers/drivers.routes';
import { DriversService } from './modules/drivers/drivers.service';
import { UsagesController } from './modules/usages/usages.controller';
import { PrismaUsagesRepository } from './modules/usages/usages.repository';
import { usagesRoutes } from './modules/usages/usages.routes';
import { UsagesService } from './modules/usages/usages.service';
import { errorHandler, notFoundHandler } from './shared/middlewares/errorHandler';
import { createRateLimiter, type RateLimitOptions } from './shared/middlewares/rateLimiter';

export type AppOptions = {
  rateLimit?: RateLimitOptions;
  /** Quantidade de proxies confiáveis à frente da API (ex.: 1 no Render/Railway), para obter o IP real */
  trustProxy?: number;
};

const DEFAULT_RATE_LIMIT: RateLimitOptions = { windowMs: 60_000, max: 100 };

/**
 * Monta a aplicação Express. Recebe o PrismaClient por parâmetro (composition root),
 * o que permite subir a app nos testes sem depender de um banco real.
 */
export function createApp(prisma: PrismaClient, options: AppOptions = {}) {
  const carsRepository = new PrismaCarsRepository(prisma);
  const driversRepository = new PrismaDriversRepository(prisma);
  const usagesRepository = new PrismaUsagesRepository(prisma);

  const carsController = new CarsController(new CarsService(carsRepository));
  const driversController = new DriversController(new DriversService(driversRepository));
  const usagesController = new UsagesController(
    new UsagesService(usagesRepository, carsRepository, driversRepository),
  );

  const app = express();
  app.set('trust proxy', options.trustProxy ?? 0);

  // CSP desativada apenas para o Swagger UI carregar seus assets inline.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(createRateLimiter(options.rateLimit ?? DEFAULT_RATE_LIMIT));
  app.use(express.json());

  app.get('/', (_req, res) => res.redirect('/docs'));
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.get('/docs.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use('/api/cars', carsRoutes(carsController));
  app.use('/api/drivers', driversRoutes(driversController));
  app.use('/api/usages', usagesRoutes(usagesController));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
