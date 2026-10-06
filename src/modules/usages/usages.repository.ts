import type { Car, CarUsage, PrismaClient } from '@prisma/client';
import type { ListUsagesFilters } from './usages.schemas';

export type UsageWithDetails = CarUsage & {
  car: Pick<Car, 'id' | 'plate' | 'color' | 'brand'>;
  driver: { id: string; name: string };
};

export type CreateUsageData = {
  carId: string;
  driverId: string;
  reason: string;
  startedAt: Date;
};

export interface UsagesRepository {
  create(data: CreateUsageData): Promise<UsageWithDetails>;
  finish(id: string, endedAt: Date): Promise<UsageWithDetails>;
  findById(id: string): Promise<CarUsage | null>;
  findActiveByCar(carId: string): Promise<CarUsage | null>;
  findActiveByDriver(driverId: string): Promise<CarUsage | null>;
  list(filters: ListUsagesFilters): Promise<UsageWithDetails[]>;
}

// Dados do motorista e do automóvel retornados junto de cada utilização.
const details = {
  car: { select: { id: true, plate: true, color: true, brand: true } },
  driver: { select: { id: true, name: true } },
} as const;

export class PrismaUsagesRepository implements UsagesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: CreateUsageData) {
    return this.prisma.carUsage.create({ data, include: details });
  }

  finish(id: string, endedAt: Date) {
    return this.prisma.carUsage.update({ where: { id }, data: { endedAt }, include: details });
  }

  findById(id: string) {
    return this.prisma.carUsage.findUnique({ where: { id } });
  }

  findActiveByCar(carId: string) {
    return this.prisma.carUsage.findFirst({ where: { carId, endedAt: null } });
  }

  findActiveByDriver(driverId: string) {
    return this.prisma.carUsage.findFirst({ where: { driverId, endedAt: null } });
  }

  list({ active, carId, driverId }: ListUsagesFilters) {
    return this.prisma.carUsage.findMany({
      where: {
        carId,
        driverId,
        ...(active !== undefined && { endedAt: active ? null : { not: null } }),
      },
      include: details,
      orderBy: { startedAt: 'desc' },
    });
  }
}
