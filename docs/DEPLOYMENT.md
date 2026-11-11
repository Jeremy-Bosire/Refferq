# Deployment guide

Deployment instructions here describe application hosting only. The application branch does not yet provide production-ready M-Pesa collection, B2C payouts, wallet accounting, KYC, or customer-funds safeguarding.

## Required before deploying

- Managed PostgreSQL with automated backups and a tested restore procedure.
- A unique `JWT_SECRET` of at least 32 random characters, stored in the hosting provider's secret manager.
- HTTPS and the correct public `NEXT_PUBLIC_APP_URL`.
- Verified Resend sender domain and configured `RESEND_API_KEY` if email delivery is required.
- Verified `NEXT_PUBLIC_BRAND_NAME`, support contacts, business details, legal pages, and privacy notice before public launch.
- A reviewed migration baseline and database adoption procedure; see [MIGRATION.md](MIGRATION.md).

## Docker Compose

For local development, configure `.env` from `.env.example`, then run:

```sh
docker compose up --build
```

Do not use development defaults, placeholder credentials, or a local database volume as a production deployment plan. Protect database backups and restrict database/network access.

## Vercel or another Node host

1. Provision PostgreSQL and configure `DATABASE_URL` and `JWT_SECRET` as encrypted environment variables.
2. Configure the public application URL and brand variables.
3. Build with the repository's production build command.
4. Apply only the reviewed Prisma migration sequence during a controlled deployment window.
5. Verify sign-in, email delivery (if enabled), database connectivity, logs, backups, and rollback procedures.

## Mobile money go-live (manual, not currently implemented)

Before setting any M-Pesa credentials, complete provider onboarding and sandbox integration, callback verification, idempotency, reconciliation, reversals, incident response, and written customer-fund safeguarding arrangements. Obtain Kenyan legal and accounting review of the complete operating model. Production Daraja access, PSP settlement, SMS sender approval, ODPC obligations, DNS, and legal review remain manual launch steps. Keep `MPESA_ENABLED=false`, `PAYMENT_COLLECTOR=disabled`, and `PAYOUT_PROVIDER=disabled` until the related implementation and approvals are complete.
