-- Add nullable link columns first
ALTER TABLE "barbers" ADD COLUMN "userId" TEXT;
ALTER TABLE "clients" ADD COLUMN "userId" TEXT;

-- Backfill BARBER.userId from users (same tenant + BARBER role + email/phone match)
WITH barber_candidates AS (
  SELECT
    b.id AS barber_id,
    u.id AS user_id,
    ROW_NUMBER() OVER (
      PARTITION BY b.id
      ORDER BY
        CASE
          WHEN b.email IS NOT NULL AND u.email IS NOT NULL AND LOWER(b.email) = LOWER(u.email) THEN 0
          ELSE 1
        END,
        u."createdAt"
    ) AS rn_barber,
    ROW_NUMBER() OVER (
      PARTITION BY u.id
      ORDER BY
        CASE
          WHEN b.email IS NOT NULL AND u.email IS NOT NULL AND LOWER(b.email) = LOWER(u.email) THEN 0
          ELSE 1
        END,
        b."createdAt"
    ) AS rn_user
  FROM "barbers" b
  JOIN "users" u
    ON u."shopId" = b."shopId"
   AND u."role" = 'BARBER'
   AND (
     (b.email IS NOT NULL AND u.email IS NOT NULL AND LOWER(b.email) = LOWER(u.email))
     OR
     (b.phone IS NOT NULL AND u.phone IS NOT NULL AND b.phone = u.phone)
   )
  WHERE b."userId" IS NULL
)
UPDATE "barbers" b
SET "userId" = c.user_id
FROM barber_candidates c
WHERE b.id = c.barber_id
  AND c.rn_barber = 1
  AND c.rn_user = 1
  AND b."userId" IS NULL;

-- Backfill CLIENT.userId from users (same tenant + CLIENT role + email/phone match)
WITH client_candidates AS (
  SELECT
    c.id AS client_id,
    u.id AS user_id,
    ROW_NUMBER() OVER (
      PARTITION BY c.id
      ORDER BY
        CASE
          WHEN c.email IS NOT NULL AND u.email IS NOT NULL AND LOWER(c.email) = LOWER(u.email) THEN 0
          ELSE 1
        END,
        u."createdAt"
    ) AS rn_client,
    ROW_NUMBER() OVER (
      PARTITION BY u.id
      ORDER BY
        CASE
          WHEN c.email IS NOT NULL AND u.email IS NOT NULL AND LOWER(c.email) = LOWER(u.email) THEN 0
          ELSE 1
        END,
        c."createdAt"
    ) AS rn_user
  FROM "clients" c
  JOIN "users" u
    ON u."shopId" = c."shopId"
   AND u."role" = 'CLIENT'
   AND (
     (c.email IS NOT NULL AND u.email IS NOT NULL AND LOWER(c.email) = LOWER(u.email))
     OR
     (c.phone IS NOT NULL AND u.phone IS NOT NULL AND c.phone = u.phone)
   )
  WHERE c."userId" IS NULL
)
UPDATE "clients" c
SET "userId" = x.user_id
FROM client_candidates x
WHERE c.id = x.client_id
  AND x.rn_client = 1
  AND x.rn_user = 1
  AND c."userId" IS NULL;

-- Unique constraints (nullable; multiple NULLs allowed)
CREATE UNIQUE INDEX "barbers_userId_key" ON "barbers"("userId");
CREATE UNIQUE INDEX "clients_userId_key" ON "clients"("userId");

-- Helpful indexes
CREATE INDEX "barbers_userId_idx" ON "barbers"("userId");
CREATE INDEX "clients_userId_idx" ON "clients"("userId");

-- Foreign keys
ALTER TABLE "barbers"
  ADD CONSTRAINT "barbers_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "clients"
  ADD CONSTRAINT "clients_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
