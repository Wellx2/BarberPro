-- AlterTable
ALTER TABLE "barbers" ADD COLUMN     "balance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "barbershops" ADD COLUMN     "email" TEXT,
ADD COLUMN     "whatsapp" TEXT;
