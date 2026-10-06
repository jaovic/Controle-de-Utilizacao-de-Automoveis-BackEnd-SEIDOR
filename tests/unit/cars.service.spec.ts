import { CarsService } from '../../src/modules/cars/cars.service';
import { createCarSchema } from '../../src/modules/cars/cars.schemas';
import { ConflictError, NotFoundError } from '../../src/shared/errors/AppError';
import { makeCar, mockCarsRepository } from '../helpers/factories';

describe('CarsService', () => {
  let repository: ReturnType<typeof mockCarsRepository>;
  let service: CarsService;

  beforeEach(() => {
    repository = mockCarsRepository();
    service = new CarsService(repository);
  });

  describe('create', () => {
    it('cria o automóvel quando a placa está disponível', async () => {
      const input = { plate: 'ABC1D23', color: 'Prata', brand: 'Fiat' };
      const car = makeCar(input);
      repository.findByPlate.mockResolvedValue(null);
      repository.create.mockResolvedValue(car);

      await expect(service.create(input)).resolves.toEqual(car);
      expect(repository.create).toHaveBeenCalledWith(input);
    });

    it('rejeita placa já cadastrada', async () => {
      repository.findByPlate.mockResolvedValue(makeCar());

      await expect(service.create({ plate: 'ABC1D23', color: 'Prata', brand: 'Fiat' })).rejects.toBeInstanceOf(
        ConflictError,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('atualiza sem checar a placa quando ela não muda', async () => {
      const car = makeCar();
      repository.findById.mockResolvedValue(car);
      repository.update.mockResolvedValue({ ...car, color: 'Preto' });

      await service.update(car.id, { plate: car.plate, color: 'Preto' });

      expect(repository.findByPlate).not.toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith(car.id, { plate: car.plate, color: 'Preto' });
    });

    it('rejeita troca para uma placa que pertence a outro automóvel', async () => {
      const car = makeCar();
      repository.findById.mockResolvedValue(car);
      repository.findByPlate.mockResolvedValue(makeCar({ plate: 'XYZ9876' }));

      await expect(service.update(car.id, { plate: 'XYZ9876' })).rejects.toBeInstanceOf(ConflictError);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('retorna 404 para automóvel inexistente', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update('id', { color: 'Azul' })).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('delete', () => {
    it('exclui automóvel sem utilizações', async () => {
      const car = makeCar();
      repository.findById.mockResolvedValue(car);
      repository.hasUsages.mockResolvedValue(false);

      await service.delete(car.id);

      expect(repository.delete).toHaveBeenCalledWith(car.id);
    });

    it('não exclui automóvel com histórico de utilização', async () => {
      const car = makeCar();
      repository.findById.mockResolvedValue(car);
      repository.hasUsages.mockResolvedValue(true);

      await expect(service.delete(car.id)).rejects.toBeInstanceOf(ConflictError);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('lança NotFoundError quando não encontra', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById('id')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('list', () => {
    it('repassa os filtros de cor e marca ao repositório', async () => {
      repository.list.mockResolvedValue([]);

      await service.list({ color: 'Prata', brand: 'Fiat' });

      expect(repository.list).toHaveBeenCalledWith({ color: 'Prata', brand: 'Fiat' });
    });
  });
});

describe('createCarSchema', () => {
  it('normaliza a placa (maiúsculas, sem hífen)', () => {
    const result = createCarSchema.parse({ plate: 'abc-1234', color: 'Prata', brand: 'Fiat' });
    expect(result.plate).toBe('ABC1234');
  });

  it('aceita placa no padrão Mercosul', () => {
    expect(createCarSchema.safeParse({ plate: 'BRA2E19', color: 'Preto', brand: 'VW' }).success).toBe(true);
  });

  it('rejeita placa em formato inválido', () => {
    expect(createCarSchema.safeParse({ plate: '1234ABC', color: 'Preto', brand: 'VW' }).success).toBe(false);
  });
});
