import { DriversService } from '../../src/modules/drivers/drivers.service';
import { ConflictError, NotFoundError } from '../../src/shared/errors/AppError';
import { makeDriver, mockDriversRepository } from '../helpers/factories';

describe('DriversService', () => {
  let repository: ReturnType<typeof mockDriversRepository>;
  let service: DriversService;

  beforeEach(() => {
    repository = mockDriversRepository();
    service = new DriversService(repository);
  });

  it('cria um motorista', async () => {
    const driver = makeDriver();
    repository.create.mockResolvedValue(driver);

    await expect(service.create({ name: driver.name })).resolves.toEqual(driver);
  });

  it('atualiza um motorista existente', async () => {
    const driver = makeDriver();
    repository.findById.mockResolvedValue(driver);
    repository.update.mockResolvedValue({ ...driver, name: 'Maria S.' });

    const updated = await service.update(driver.id, { name: 'Maria S.' });

    expect(updated.name).toBe('Maria S.');
    expect(repository.update).toHaveBeenCalledWith(driver.id, { name: 'Maria S.' });
  });

  it('retorna 404 ao atualizar motorista inexistente', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.update('id', { name: 'X' })).rejects.toBeInstanceOf(NotFoundError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('exclui motorista sem utilizações', async () => {
    const driver = makeDriver();
    repository.findById.mockResolvedValue(driver);
    repository.hasUsages.mockResolvedValue(false);

    await service.delete(driver.id);

    expect(repository.delete).toHaveBeenCalledWith(driver.id);
  });

  it('não exclui motorista com histórico de utilização', async () => {
    const driver = makeDriver();
    repository.findById.mockResolvedValue(driver);
    repository.hasUsages.mockResolvedValue(true);

    await expect(service.delete(driver.id)).rejects.toBeInstanceOf(ConflictError);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('busca motorista pelo id', async () => {
    const driver = makeDriver();
    repository.findById.mockResolvedValue(driver);

    await expect(service.getById(driver.id)).resolves.toEqual(driver);
  });

  it('repassa o filtro de nome ao repositório', async () => {
    repository.list.mockResolvedValue([makeDriver()]);

    const drivers = await service.list({ name: 'maria' });

    expect(drivers).toHaveLength(1);
    expect(repository.list).toHaveBeenCalledWith({ name: 'maria' });
  });
});
