CREATE TABLE "phone_otps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "phone_otps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "phone_otps_user_id_is_used_created_at_idx" ON "phone_otps"("user_id", "is_used", "created_at");

ALTER TABLE "phone_otps" ADD CONSTRAINT "phone_otps_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
