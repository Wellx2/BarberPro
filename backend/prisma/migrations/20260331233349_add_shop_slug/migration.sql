/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `barbershops` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "barbershops" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "barbershops_slug_key" ON "barbershops"("slug");
