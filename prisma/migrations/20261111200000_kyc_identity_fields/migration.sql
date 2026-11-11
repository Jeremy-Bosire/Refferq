CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED');

ALTER TABLE "users"
ADD COLUMN "legal_name_encrypted" TEXT,
ADD COLUMN "identity_document_type" TEXT,
ADD COLUMN "identity_document_encrypted" TEXT,
ADD COLUMN "identity_document_hash" TEXT,
ADD COLUMN "kra_pin_encrypted" TEXT,
ADD COLUMN "kyc_status" "KycStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN "kyc_submitted_at" TIMESTAMP(3),
ADD COLUMN "identity_consent_at" TIMESTAMP(3),
ADD COLUMN "identity_consent_version" TEXT,
ADD COLUMN "kyc_reviewed_at" TIMESTAMP(3),
ADD COLUMN "kyc_reviewed_by" TEXT;

CREATE UNIQUE INDEX "users_identity_document_hash_key" ON "users"("identity_document_hash");
