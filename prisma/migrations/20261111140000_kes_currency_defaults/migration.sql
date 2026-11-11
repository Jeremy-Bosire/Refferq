-- Set KES as the default for new rows without silently relabeling historical amounts.
ALTER TABLE "conversions" ALTER COLUMN "currency" SET DEFAULT 'KES';
ALTER TABLE "program_settings" ALTER COLUMN "currency" SET DEFAULT 'KES';
ALTER TABLE "coupons" ALTER COLUMN "currency" SET DEFAULT 'KES';
ALTER TABLE "invoices" ALTER COLUMN "currency" SET DEFAULT 'KES';
ALTER TABLE "programs" ALTER COLUMN "currency" SET DEFAULT 'KES';
