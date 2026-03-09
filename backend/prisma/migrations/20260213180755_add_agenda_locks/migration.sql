-- CreateTable
CREATE TABLE "agenda_locks" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "lockedBy" TEXT NOT NULL,
    "forceOverride" BOOLEAN NOT NULL DEFAULT false,
    "notifiedClients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_locks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agenda_locks_shopId_teamMemberId_date_idx" ON "agenda_locks"("shopId", "teamMemberId", "date");

-- CreateIndex
CREATE INDEX "agenda_locks_teamMemberId_date_idx" ON "agenda_locks"("teamMemberId", "date");

-- AddForeignKey
ALTER TABLE "agenda_locks" ADD CONSTRAINT "agenda_locks_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "barbershops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_locks" ADD CONSTRAINT "agenda_locks_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "barbers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_locks" ADD CONSTRAINT "agenda_locks_lockedBy_fkey" FOREIGN KEY ("lockedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
