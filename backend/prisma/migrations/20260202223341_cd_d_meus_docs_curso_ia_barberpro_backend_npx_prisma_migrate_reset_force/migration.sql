/*
  Warnings:

  - You are about to drop the column `latitude` on the `barbershops` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `barbershops` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('AGENDA', 'FINANCEIRO', 'CAIXA', 'SERVICOS', 'GESTAO_TIME', 'PRODUTOS', 'MARKETING', 'PLANOS', 'NOTIFICACOES', 'CLIENTES');

-- AlterTable
ALTER TABLE "barbershops" DROP COLUMN "latitude",
DROP COLUMN "longitude";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "costPrice" DOUBLE PRECISION,
ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "image" TEXT;

-- CreateTable
CREATE TABLE "barbershop_modules" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "moduleType" "ModuleType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "enabledAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "enabledBy" TEXT,
    "disabledBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barbershop_modules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "barbershop_modules_shopId_enabled_idx" ON "barbershop_modules"("shopId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "barbershop_modules_shopId_moduleType_key" ON "barbershop_modules"("shopId", "moduleType");

-- AddForeignKey
ALTER TABLE "barbershop_modules" ADD CONSTRAINT "barbershop_modules_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "barbershops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
