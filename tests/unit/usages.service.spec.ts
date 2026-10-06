import type { UsageWithDetails } from '../../src/modules/usages/usages.repository';
import { UsagesService } from '../../src/modules/usages/usages.service';
import { AppError, ConflictError, NotFoundError } from '../../src/shared/errors/AppError';
import {
  makeCar,
  makeDriver,
  makeUsage,
  mockCarsRepository,
  mockDriversRepository,
  mockUsagesRepository,
} from '../helpers/factories';

const NOW = new Date('2026-10-06T12:00:00Z');

describe('UsagesService', () => {
  let usages: ReturnType<typeof mockUsagesRepository>;
  let cars: ReturnType<typeof mockCarsRepository>;
  let drivers: ReturnType<typeof mockDriversRepository>;
  let service: UsagesService;

  const car = makeCar();
  const driver = makeDriver();

  beforeEach(() => {
    usages = mockUsagesRepository();
    cars = mockCarsRepository();
    drivers = mockDriversRepository();
    service = new UsagesService(usages, cars, drivers, () => NOW);

    cars.findById.mockResolvedValue(car);
    drivers.findById.mockResolvedValue(driver);
    usages.findActiveByCar.mockResolvedValue(null);
    usages.findActiveByDriver.mockResolvedValue(null);
  });

  describe('start', () => {
    const input = () => ({ carId: car.id, driverId: driver.id, reason: 'Visita a cliente' });

    it('inicia a utilização usando a data atual quando startedAt não é informado', async () => {
      const created = { ...makeUsage({ carId: car.id, driverId: driver.id }), car, driver } as UsageWithDetails;
      usages.create.mockResolvedValue(created);

      await expect(service.start(input())).resolves.toEqual(created);
      expect(usages.create).toHaveBeenCalledWith({ ...input(), startedAt: NOW });
    });

    it('respeita startedAt informado no passado', async () => {
      const startedAt = new Date('2026-10-05T09:00:00Z');

      await service.start({ ...input(), startedAt });

      expect(usages.create).toHaveBeenCalledWith(expect.objectContaining({ startedAt }));
    });

    it('rejeita startedAt no futuro', async () => {
      await expect(service.start({ ...input(), startedAt: new Date('2026-10-07T00:00:00Z') })).rejects.toBeInstanceOf(
        AppError,
      );
      expect(usages.create).not.toHaveBeenCalled();
    });

    it('retorna 404 quando o automóvel não existe', async () => {
      cars.findById.mockResolvedValue(null);

      await expect(service.start(input())).rejects.toBeInstanceOf(NotFoundError);
    });

    it('retorna 404 quando o motorista não existe', async () => {
      drivers.findById.mockResolvedValue(null);

      await expect(service.start(input())).rejects.toBeInstanceOf(NotFoundError);
    });

    it('não permite usar um automóvel que já está em uso', async () => {
      usages.findActiveByCar.mockResolvedValue(makeUsage({ carId: car.id }));

      await expect(service.start(input())).rejects.toThrow(ConflictError);
      await expect(service.start(input())).rejects.toThrow(/já está em uso/);
      expect(usages.create).not.toHaveBeenCalled();
    });

    it('não permite que um motorista use dois automóveis ao mesmo tempo', async () => {
      usages.findActiveByDriver.mockResolvedValue(makeUsage({ driverId: driver.id }));

      await expect(service.start(input())).rejects.toThrow(ConflictError);
      await expect(service.start(input())).rejects.toThrow(/já está utilizando outro automóvel/);
      expect(usages.create).not.toHaveBeenCalled();
    });
  });

  describe('finish', () => {
    it('finaliza usando a data atual quando endedAt não é informado', async () => {
      const usage = makeUsage();
      usages.findById.mockResolvedValue(usage);

      await service.finish(usage.id, {});

      expect(usages.finish).toHaveBeenCalledWith(usage.id, NOW);
    });

    it('finaliza com a data informada', async () => {
      const usage = makeUsage();
      const endedAt = new Date('2026-10-01T18:00:00Z');
      usages.findById.mockResolvedValue(usage);

      await service.finish(usage.id, { endedAt });

      expect(usages.finish).toHaveBeenCalledWith(usage.id, endedAt);
    });

    it('retorna 404 para utilização inexistente', async () => {
      usages.findById.mockResolvedValue(null);

      await expect(service.finish('id', {})).rejects.toBeInstanceOf(NotFoundError);
    });

    it('não finaliza uma utilização já finalizada', async () => {
      usages.findById.mockResolvedValue(makeUsage({ endedAt: new Date('2026-10-01T10:00:00Z') }));

      await expect(service.finish('id', {})).rejects.toBeInstanceOf(ConflictError);
      expect(usages.finish).not.toHaveBeenCalled();
    });

    it('rejeita data de término anterior à data de início', async () => {
      const usage = makeUsage({ startedAt: new Date('2026-10-01T08:00:00Z') });
      usages.findById.mockResolvedValue(usage);

      await expect(service.finish(usage.id, { endedAt: new Date('2026-10-01T07:00:00Z') })).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(usages.finish).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('repassa os filtros ao repositório', async () => {
      usages.list.mockResolvedValue([]);

      await service.list({ active: true });

      expect(usages.list).toHaveBeenCalledWith({ active: true });
    });
  });
});
