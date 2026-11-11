ALTER TABLE "users"
ADD COLUMN "phone_encrypted" TEXT,
ADD COLUMN "phone_hash" TEXT,
ADD COLUMN "phone_verified_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_phone_hash_key" ON "users"("phone_hash");
