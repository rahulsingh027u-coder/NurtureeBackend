
-- P0-4 fix: Notification + OtpCode id generation
-- These tables have text id columns with no default. Prisma's @default(cuid())
-- doesn't work with schema drift, so we add a DB-level default.
-- Re-run these if the DB is rebuilt from this schema.

ALTER TABLE "Notification" ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "OtpCode" ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
