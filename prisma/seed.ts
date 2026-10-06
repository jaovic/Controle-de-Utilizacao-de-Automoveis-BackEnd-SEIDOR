import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Popula o banco com alguns dados de exemplo. Idempotente: não duplica se já houver dados. */
async function main() {
  if ((await prisma.car.count()) > 0 || (await prisma.driver.count()) > 0) {
    console.log('Seed ignorado: o banco já possui dados.');
    return;
  }

  await prisma.car.createMany({
    data: [
      { plate: 'ABC1D23', color: 'Prata', brand: 'Fiat' },
      { plate: 'BRA2E19', color: 'Preto', brand: 'Volkswagen' },
      { plate: 'XYZ9876', color: 'Branco', brand: 'Toyota' },
    ],
  });

  await prisma.driver.createMany({
    data: [{ name: 'Maria Souza' }, { name: 'João Pereira' }, { name: 'Ana Lima' }],
  });

  console.log('Seed concluído: 3 automóveis e 3 motoristas criados.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
