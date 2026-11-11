# Database migration notes

## Current migration status

This repository did not have a Prisma migration baseline when the localization work began. Incremental SQL migrations were added for KES currency defaults, fixed-precision money columns, nullable Kenyan phone fields, and country/county profile fields. They are not a complete baseline for arbitrary existing databases.

## Before migrating an existing database

1. Stop writes and take a restorable PostgreSQL backup.
2. Record the current schema and row counts for all money-bearing tables.
3. Verify whether the database already has a Prisma `_prisma_migrations` table and whether it was managed with `db push`.
4. Review the migration SQL against a clone of the production database. Do not relabel historical INR/USD/EUR/GBP records as KES.
5. Reconcile representative records before and after applying any migration and retain the backup until the application has been verified.

Do not mark migrations as applied or run `prisma migrate deploy` against an existing database until a reviewed baseline and adoption procedure has been prepared for that database. A fresh database should also be provisioned only after the migration history is made complete and repeatable.

## Money data

Integer fields ending in `Cents` represent minor currency units (100 per KES for KES records); the legacy field names are retained to avoid a premature destructive rename. Currency metadata must be preserved. Some fixed program/coupon values use Prisma `Decimal`; avoid converting them to JavaScript floating-point arithmetic. Referral estimates without a recorded currency are not safe to reinterpret as KES.

## Kenyan phone fields

The Kenyan phone migration adds nullable `phone_encrypted`, `phone_hash`, and `phone_verified_at` columns plus a unique index on the keyed hash. Existing users remain valid with `NULL` phone data. New registrations normalize the number to E.164, encrypt it at rest, and store a keyed hash for uniqueness. Set a stable, randomly generated `PII_MASTER_KEY` (at least 32 characters) before production; losing or rotating it without re-encrypting records makes stored phone numbers unrecoverable. Phone remains unverified until the user completes the account phone-verification OTP flow.

The country profile migration defaults existing users to `KE` and adds an optional `county`. Registration currently accepts only Kenya; country configuration is a code-level extension point and does not activate payment or tax integrations.

The KYC migration adds nullable encrypted identity fields, a keyed document hash, consent metadata, reviewer metadata, and a status defaulting to `NOT_STARTED`. Collection is disabled unless all KYC environment gates are set. An admin review queue is implemented and audit logs record each detailed identity view and decision. Do not enable collection until a privacy notice is published, retention controls are configured, and the required legal review is complete. The stored identity fields require the stable `PII_MASTER_KEY` documented above.

## Rollback

Schema rollback must be rehearsed against a database clone. For data type changes, restore from the verified backup if values cannot be losslessly converted. Do not use `prisma db push` as a production rollback mechanism.
# Phone verification migration

Apply the `20261111210000_phone_otp` Prisma migration after deploying code that includes the `PhoneOTP` model. The migration creates a separate table for hashed phone verification challenges and does not modify existing email login OTP records. Then regenerate Prisma Client (`npx prisma generate`) and restart the application.

To enable SMS, configure `SMS_PROVIDER=africas_talking`, `AT_API_KEY`, `AT_USERNAME`, and optionally `AT_SENDER_ID`; use `AT_ENV=sandbox` for sandbox testing. If SMS is disabled or unavailable, the app attempts email delivery through Resend. Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` for fallback. SMS is disabled by default.
