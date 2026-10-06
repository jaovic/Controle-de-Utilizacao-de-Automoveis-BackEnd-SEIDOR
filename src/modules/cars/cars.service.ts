import { ConflictError, NotFoundError } from '../../shared/errors/AppError';
import type { CarsRepository } from './cars.repository';
import type { CreateCarInput, ListCarsFilters, UpdateCarInput } from './cars.schemas';

export class CarsService {
  constructor(private readonly carsRepository: CarsRepository) {}

  async create(data: CreateCarInput) {
    await this.ensurePlateIsAvailable(data.plate);
    return this.carsRepository.create(data);
  }

  async update(id: string, data: UpdateCarInput) {
    const car = await this.getById(id);

    if (data.plate && data.plate !== car.plate) {
      await this.ensurePlateIsAvailable(data.plate);
    }

    return this.carsRepository.update(id, data);
  }

  async delete(id: string) {
    await this.getById(id);

    // Mantém o histórico de utilizações: um carro já utilizado não pode ser removido.
    if (await this.carsRepository.hasUsages(id)) {
      throw new ConflictError('Automóvel possui registros de utilização e não pode ser excluído');
    }

    await this.carsRepository.delete(id);
  }

  async getById(id: string) {
    const car = await this.carsRepository.findById(id);
    if (!car) throw new NotFoundError('Automóvel não encontrado');
    return car;
  }

  list(filters: ListCarsFilters) {
    return this.carsRepository.list(filters);
  }

  private async ensurePlateIsAvailable(plate: string) {
    const existing = await this.carsRepository.findByPlate(plate);
    if (existing) throw new ConflictError(`Já existe um automóvel com a placa ${plate}`);
  }
}
