-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "barbershops" ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "primaryColor" TEXT DEFAULT '#f59e0b';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "globalPushEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "user_shop_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_shop_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_shop_access_userId_idx" ON "user_shop_access"("userId");

-- CreateIndex
CREATE INDEX "user_shop_access_shopId_idx" ON "user_shop_access"("shopId");

-- CreateIndex
CREATE INDEX "user_shop_access_isActive_idx" ON "user_shop_access"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "user_shop_access_userId_shopId_key" ON "user_shop_access"("userId", "shopId");

-- AddForeignKey
ALTER TABLE "user_shop_access" ADD CONSTRAINT "user_shop_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_shop_access" ADD CONSTRAINT "user_shop_access_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "barbershops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
