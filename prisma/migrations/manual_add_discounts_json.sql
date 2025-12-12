-- Manual migration: Add discountsJson field to AdminSettings
-- Run this SQL directly on your database if Prisma migrate has issues

ALTER TABLE "AdminSettings" 
ADD COLUMN IF NOT EXISTS "discountsJson" JSONB;

-- Set default value for existing records
UPDATE "AdminSettings" 
SET "discountsJson" = '{"global": {}, "individual": {}}'::jsonb 
WHERE "discountsJson" IS NULL;

