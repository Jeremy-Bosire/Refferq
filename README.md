# GanjiLink

GanjiLink is a Kenya-first referral platform, adapted from the MIT-licensed Refferq project. The original license and copyright attribution are preserved in [`LICENSE`](LICENSE).

This branch is an active localization and product-development effort. Kenyan payment collection, mobile-money payouts, a wallet ledger, phone OTP, KYC, and a production-ready safeguarding arrangement are not yet implemented. Do not accept customer funds based on this branch's current capabilities.

## Current capabilities

- Next.js App Router, React, TypeScript, PostgreSQL, and Prisma.
- Admin and referral-partner dashboards, referral tracking, program settings, and email notifications.
- KES-first display helpers, East Africa date formatting, and initial English/Kiswahili translation coverage.
- Configurable public product name and color through environment variables.

## Local development

1. Install Node.js 20 and Docker Compose.
2. Copy `.env.example` to `.env` and set a local PostgreSQL `DATABASE_URL` and a random `JWT_SECRET` of at least 32 characters. Do not commit `.env`.
3. Start the app and database with `docker compose up --build`.
4. Open `http://localhost:3000`.

For non-Docker development, install dependencies, generate Prisma Client, prepare the local database, and run `npm run dev`. See [Deployment](docs/DEPLOYMENT.md) and [Migration](docs/MIGRATION.md) notes before using a persistent database.

## Configuration

See [`.env.example`](.env.example) for the supported configuration names. Provider credentials are blank by default. Daraja, SMS, deposits, payouts, and customer-fund custody must not be treated as live integrations until their adapters, provider approvals, reconciliation, and operational controls have been completed.

## Product and launch decisions

- Read the [localization audit](docs/LOCALIZATION_AUDIT.md), [implementation decisions](docs/LOCALIZATION_DECISIONS.md), [Swahili review list](docs/SWAHILI_REVIEW_NEEDED.md), and [compliance checklist](docs/COMPLIANCE_CHECKLIST.md).
- Current financial implementation does not classify customer deposits as revenue, reward deposits, or calculate deposit returns.
- Only claims verified for the actual deployed product should be published. Business registration and support placeholders must be supplied and verified before launch.

## License

MIT. See [`LICENSE`](LICENSE) for the original copyright and license text.
