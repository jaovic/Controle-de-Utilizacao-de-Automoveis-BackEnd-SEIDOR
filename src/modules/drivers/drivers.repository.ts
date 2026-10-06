import type { Driver, PrismaClient } from '@prisma/client';
import type { CreateDriverInput, ListDriversFilters, UpdateDriverInput } from './drivers.schemas';

export interface DriversRepository {
  create(data: CreateDriverInput): Promise<Driver>;
  update(id: string, data: UpdateDriverInput): Promise<Driver>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Driver | null>;
  list(filters: ListDriversFilters): Promise<Driver[]>;
  hasUsages(id: string): Promise<boolean>;
}

export class PrismaDriversRepository implements DriversRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: CreateDriverInput) {
    return this.prisma.driver.create({ data });
  }

  update(id: string, data: UpdateDriverInput) {
    return this.prisma.driver.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.prisma.driver.delete({ where: { id } });
  }

  findById(id: string) {
    return this.prisma.driver.findUnique({ where: { id } });
  }

  list({ name }: ListDriversFilters) {
    return this.prisma.driver.findMany({
      where: name ? { name: { contains: name, mode: 'insensitive' } } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async hasUsages(id: string) {
    const count = await this.prisma.carUsage.count({ where: { driverId: id } });
    return count > 0;
  }
}
