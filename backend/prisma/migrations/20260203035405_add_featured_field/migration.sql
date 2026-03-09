-- AlterTable
ALTER TABLE "products" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;
