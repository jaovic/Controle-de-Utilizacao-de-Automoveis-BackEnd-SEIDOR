import { AppError, ConflictError, NotFoundError } from '../../shared/errors/AppError';
import type { CarsRepository } from '../cars/cars.repository';
import type { DriversRepository } from '../drivers/drivers.repository';
import type { UsagesRepository } from './usages.repository';
import type { FinishUsageInput, ListUsagesFilters, StartUsageInput } from './usages.schemas';

export class UsagesService {
  constructor(
    private readonly usagesRepository: UsagesRepository,
    private readonly carsRepository: CarsRepository,
    private readonly driversRepository: DriversRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * Inicia a utilização de um automóvel por um motorista.
   * Regras: o automóvel não pode estar em uso e o motorista não pode estar usando outro automóvel.
   * Os índices únicos parciais no banco cobrem o caso de requisições simultâneas.
   */
  async start({ carId, driverId, reason, startedAt }: StartUsageInput) {
    const now = this.now();
    const startDate = startedAt ?? now;

    if (startDate > now) {
      throw new AppError('A data de início não pode estar no futuro');
    }

    const [car, driver] = await Promise.all([
      this.carsRepository.findById(carId),
      this.driversRepository.findById(driverId),
    ]);
    if (!car) throw new NotFoundError('Automóvel não encontrado');
    if (!driver) throw new NotFoundError('Motorista não encontrado');

    const [carInUse, driverBusy] = await Promise.all([
      this.usagesRepository.findActiveByCar(carId),
      this.usagesRepository.findActiveByDriver(driverId),
    ]);
    if (carInUse) throw new ConflictError(`O automóvel ${car.plate} já está em uso por outro motorista`);
    if (driverBusy) throw new ConflictError(`O motorista ${driver.name} já está utilizando outro automóvel`);

    return this.usagesRepository.create({ carId, driverId, reason, startedAt: startDate });
  }

  /** Finaliza uma utilização em andamento, registrando a data de término. */
  async finish(id: string, { endedAt }: FinishUsageInput) {
    const usage = await this.usagesRepository.findById(id);
    if (!usage) throw new NotFoundError('Utilização não encontrada');
    if (usage.endedAt) throw new ConflictError('Esta utilização já foi finalizada');

    const endDate = endedAt ?? this.now();
    if (endDate < usage.startedAt) {
      throw new AppError('A data de término não pode ser anterior à data de início');
    }

    return this.usagesRepository.finish(id, endDate);
  }

  list(filters: ListUsagesFilters) {
    return this.usagesRepository.list(filters);
  }
}
