import type { Car, PrismaClient } from '@prisma/client';
import type { CreateCarInput, ListCarsFilters, UpdateCarInput } from './cars.schemas';

export interface CarsRepository {
  create(data: CreateCarInput): Promise<Car>;
  update(id: string, data: UpdateCarInput): Promise<Car>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Car | null>;
  findByPlate(plate: string): Promise<Car | null>;
  list(filters: ListCarsFilters): Promise<Car[]>;
  hasUsages(id: string): Promise<boolean>;
}

export class PrismaCarsRepository implements CarsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: CreateCarInput) {
    return this.prisma.car.create({ data });
  }

  update(id: string, data: UpdateCarInput) {
    return this.prisma.car.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.prisma.car.delete({ where: { id } });
  }

  findById(id: string) {
    return this.prisma.car.findUnique({ where: { id } });
  }

  findByPlate(plate: string) {
    return this.prisma.car.findUnique({ where: { plate } });
  }

  list({ color, brand }: ListCarsFilters) {
    return this.prisma.car.findMany({
      where: {
        ...(color && { color: { equals: color, mode: 'insensitive' } }),
        ...(brand && { brand: { equals: brand, mode: 'insensitive' } }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async hasUsages(id: string) {
    const count = await this.prisma.carUsage.count({ where: { carId: id } });
    return count > 0;
  }
}
