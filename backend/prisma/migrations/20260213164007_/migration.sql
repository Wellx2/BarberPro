-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('BARBER', 'HAIRDRESSER', 'MANICURIST', 'RECEPTIONIST', 'CASHIER', 'CLEANER');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('SIMPLE', 'PLUS', 'PREMIUM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "BlockedBy" ADD VALUE 'SYSTEM';

-- AlterTable
ALTER TABLE "barbers" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "commissionRate" DOUBLE PRECISION,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "hireDate" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "role" "TeamMemberRole" NOT NULL DEFAULT 'BARBER';

-- AlterTable
ALTER TABLE "barbershops" ADD COLUMN     "maxTeamMembers" INTEGER DEFAULT 3,
ADD COLUMN     "modulesEnabled" JSONB,
ADD COLUMN     "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionStartDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionStatus" "SubscriptionStatus" DEFAULT 'ACTIVE',
ADD COLUMN     "subscriptionTier" "SubscriptionTier" DEFAULT 'SIMPLE';

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "benefitMoneyback" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "benefitMonths" INTEGER DEFAULT 1,
ADD COLUMN     "benefitProducts" INTEGER DEFAULT 0,
ADD COLUMN     "benefitServices" INTEGER DEFAULT 0,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isPopular" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shopId" TEXT;

-- CreateIndex
CREATE INDEX "barbers_shopId_active_idx" ON "barbers"("shopId", "active");
