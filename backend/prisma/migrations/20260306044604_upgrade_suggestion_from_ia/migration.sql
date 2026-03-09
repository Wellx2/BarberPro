/*
  Warnings:

  - A unique constraint covering the columns `[iCalToken]` on the table `barbers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SupplyUnitType" AS ENUM ('UNIT', 'BOX', 'PACK', 'ML', 'GRAMS', 'LITERS', 'KG', 'METERS');

-- AlterTable
ALTER TABLE "barbers" ADD COLUMN     "iCalToken" TEXT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "supplyCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpires" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "clientId" TEXT,
    "barberId" TEXT,
    "appointmentId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barbershops_assets" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purchaseDate" DATE NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "usefulLifeMonths" INTEGER NOT NULL DEFAULT 24,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barbershops_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_items" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "unit" "SupplyUnitType" NOT NULL DEFAULT 'UNIT',
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minQuantity" DOUBLE PRECISION DEFAULT 0,
    "unitCost" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supply_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_logs_shopId_idx" ON "notification_logs"("shopId");

-- CreateIndex
CREATE INDEX "notification_logs_clientId_idx" ON "notification_logs"("clientId");

-- CreateIndex
CREATE INDEX "notification_logs_appointmentId_idx" ON "notification_logs"("appointmentId");

-- CreateIndex
CREATE INDEX "notification_logs_type_idx" ON "notification_logs"("type");

-- CreateIndex
CREATE INDEX "barbershops_assets_shopId_idx" ON "barbershops_assets"("shopId");

-- CreateIndex
CREATE INDEX "barbershops_assets_isActive_idx" ON "barbershops_assets"("isActive");

-- CreateIndex
CREATE INDEX "supply_items_shopId_idx" ON "supply_items"("shopId");

-- CreateIndex
CREATE INDEX "supply_items_shopId_category_idx" ON "supply_items"("shopId", "category");

-- CreateIndex
CREATE INDEX "supply_items_isActive_idx" ON "supply_items"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "barbers_iCalToken_key" ON "barbers"("iCalToken");

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "barbershops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "barbers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barbershops_assets" ADD CONSTRAINT "barbershops_assets_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "barbershops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_items" ADD CONSTRAINT "supply_items_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "barbershops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
