-- CreateTable
CREATE TABLE "cars" (
    "id" UUID NOT NULL,
    "plate" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "car_usages" (
    "id" UUID NOT NULL,
    "car_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "car_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cars_plate_key" ON "cars"("plate");

-- CreateIndex
CREATE INDEX "car_usages_car_id_idx" ON "car_usages"("car_id");

-- CreateIndex
CREATE INDEX "car_usages_driver_id_idx" ON "car_usages"("driver_id");

-- AddForeignKey
ALTER TABLE "car_usages" ADD CONSTRAINT "car_usages_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_usages" ADD CONSTRAINT "car_usages_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Regra de negócio garantida no banco (escrito à mão, o Prisma não modela índices parciais):
-- um automóvel e um motorista podem ter no máximo UMA utilização em andamento (ended_at IS NULL).
-- Protege contra requisições concorrentes que passariam pela validação da aplicação ao mesmo tempo.
CREATE UNIQUE INDEX "car_usages_active_car_key" ON "car_usages"("car_id") WHERE "ended_at" IS NULL;
CREATE UNIQUE INDEX "car_usages_active_driver_key" ON "car_usages"("driver_id") WHERE "ended_at" IS NULL;
