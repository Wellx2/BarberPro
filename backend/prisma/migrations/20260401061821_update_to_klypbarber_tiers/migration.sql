/*
  Warnings:

  - The values [SIMPLE,PREMIUM] on the enum `SubscriptionTier` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionTier_new" AS ENUM ('BASIC', 'PLUS', 'PRO', 'MASTER');
ALTER TABLE "barbershops" ALTER COLUMN "subscriptionTier" DROP DEFAULT;

-- Mapeamento Seguro: SIMPLE -> BASIC | PREMIUM -> PRO
ALTER TABLE "barbershops" ALTER COLUMN "subscriptionTier" TYPE "SubscriptionTier_new" USING (
  CASE 
    WHEN "subscriptionTier"::text = 'SIMPLE' THEN 'BASIC'::"SubscriptionTier_new"
    WHEN "subscriptionTier"::text = 'PREMIUM' THEN 'PRO'::"SubscriptionTier_new"
    ELSE "subscriptionTier"::text::"SubscriptionTier_new"
  END
);

ALTER TYPE "SubscriptionTier" RENAME TO "SubscriptionTier_old";
ALTER TYPE "SubscriptionTier_new" RENAME TO "SubscriptionTier";
DROP TYPE "SubscriptionTier_old";
ALTER TABLE "barbershops" ALTER COLUMN "subscriptionTier" SET DEFAULT 'BASIC';
COMMIT;

-- AlterTable
ALTER TABLE "barbershops" ALTER COLUMN "subscriptionTier" SET DEFAULT 'BASIC';
