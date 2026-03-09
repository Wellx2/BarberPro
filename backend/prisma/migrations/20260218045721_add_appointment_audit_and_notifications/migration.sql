/*
  Warnings:

  - Added the required column `createdBy` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add columns as optional first
ALTER TABLE "appointments" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "appointments" ADD COLUMN "cancelledBy" TEXT;
ALTER TABLE "appointments" ADD COLUMN "createdBy" TEXT; -- Temporariamente opcional
ALTER TABLE "appointments" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "appointments" ADD COLUMN "deletedBy" TEXT;
ALTER TABLE "appointments" ADD COLUMN "notes" TEXT;
ALTER TABLE "appointments" ADD COLUMN "totalDuration" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "appointments" ADD COLUMN "updatedBy" TEXT;

-- Step 2: Update existing appointments using the first admin user from their shop
UPDATE "appointments" a
SET 
    "createdBy" = COALESCE(
        (SELECT u.id FROM "users" u WHERE u."shopId" = a."shopId" AND u.role = 'ADMIN' ORDER BY u."createdAt" LIMIT 1),
        (SELECT u.id FROM "users" u WHERE u."shopId" = a."shopId" ORDER BY u."createdAt" LIMIT 1)
    ),
    "updatedBy" = COALESCE(
        (SELECT u.id FROM "users" u WHERE u."shopId" = a."shopId" AND u.role = 'ADMIN' ORDER BY u."createdAt" LIMIT 1),
        (SELECT u.id FROM "users" u WHERE u."shopId" = a."shopId" ORDER BY u."createdAt" LIMIT 1)
    )
WHERE "createdBy" IS NULL;

-- Step 3: Now make createdBy required (only if all rows were updated successfully)
ALTER TABLE "appointments" ALTER COLUMN "createdBy" SET NOT NULL;

-- Step 4: Create indexes
CREATE INDEX "appointments_createdBy_idx" ON "appointments"("createdBy");
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- Step 5: Add foreign key constraint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_createdBy_fkey" 
FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
