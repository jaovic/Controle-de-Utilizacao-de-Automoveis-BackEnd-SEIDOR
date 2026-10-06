import { ConflictError, NotFoundError } from '../../shared/errors/AppError';
import type { DriversRepository } from './drivers.repository';
import type { CreateDriverInput, ListDriversFilters, UpdateDriverInput } from './drivers.schemas';

export class DriversService {
  constructor(private readonly driversRepository: DriversRepository) {}

  create(data: CreateDriverInput) {
    return this.driversRepository.create(data);
  }

  async update(id: string, data: UpdateDriverInput) {
    await this.getById(id);
    return this.driversRepository.update(id, data);
  }

  async delete(id: string) {
    await this.getById(id);

    // Mantém o histórico de utilizações: um motorista com registros não pode ser removido.
    if (await this.driversRepository.hasUsages(id)) {
      throw new ConflictError('Motorista possui registros de utilização e não pode ser excluído');
    }

    await this.driversRepository.delete(id);
  }

  async getById(id: string) {
    const driver = await this.driversRepository.findById(id);
    if (!driver) throw new NotFoundError('Motorista não encontrado');
    return driver;
  }

  list(filters: ListDriversFilters) {
    return this.driversRepository.list(filters);
  }
}
