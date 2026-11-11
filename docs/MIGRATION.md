# Database migration notes

## Current migration status

This repository did not have a Prisma migration baseline when the localization work began. Two incremental SQL migrations were added for KES currency defaults and fixed-precision money columns. They are not a complete baseline for arbitrary existing databases.

## Before migrating an existing database

1. Stop writes and take a restorable PostgreSQL backup.
2. Record the current schema and row counts for all money-bearing tables.
3. Verify whether the database already has a Prisma `_prisma_migrations` table and whether it was managed with `db push`.
4. Review the migration SQL against a clone of the production database. Do not relabel historical INR/USD/EUR/GBP records as KES.
5. Reconcile representative records before and after applying any migration and retain the backup until the application has been verified.

Do not mark migrations as applied or run `prisma migrate deploy` against an existing database until a reviewed baseline and adoption procedure has been prepared for that database. A fresh database should also be provisioned only after the migration history is made complete and repeatable.

## Money data

Integer fields ending in `Cents` represent minor currency units (100 per KES for KES records); the legacy field names are retained to avoid a premature destructive rename. Currency metadata must be preserved. Some fixed program/coupon values use Prisma `Decimal`; avoid converting them to JavaScript floating-point arithmetic. Referral estimates without a recorded currency are not safe to reinterpret as KES.

## Rollback

Schema rollback must be rehearsed against a database clone. For data type changes, restore from the verified backup if values cannot be losslessly converted. Do not use `prisma db push` as a production rollback mechanism.
