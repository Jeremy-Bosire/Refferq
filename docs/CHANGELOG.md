# Changelog

## Unreleased — Kenya localization and landing foundation

- Added a KES-first currency helper and East Africa date formatting foundations, with incremental Prisma currency/decimal migrations.
- Added initial `en-KE` and `sw-KE` catalogs and a language switcher across selected authentication and dashboard screens.
- Added a public mobile-first landing page, a funding transparency page, FAQ structured data, and honest notices that deposits and mobile-money payment flows are not enabled in this preview.
- Added a PWA manifest, install icons, and a navigation-only offline fallback that avoids caching account and transaction data.
- Added an install prompt where supported, Organization structured data, and domain-gated sitemap/robots routes.
- Added `/en-KE` and `/sw-KE` landing and funding-disclosure URLs with localized metadata, hreflang alternates, and sitemap entries.
- Added initial Node unit tests for money conversion/rate arithmetic and East Africa date formatting.
- Replaced the obsolete `next lint` script with ESLint CLI and added the Next.js flat config; the existing repository currently has lint findings to resolve.
- Localized the affiliate settings form, changed its new-profile country default to Kenya, and removed an unverified claim about payout-detail encryption.
- The new landing/PWA/settings files pass targeted ESLint checks; repository-wide lint still reports legacy findings.
- Added Kenyan mobile normalization/validation and required a phone number on new registrations; phone SMS verification remains explicitly unimplemented.
- Added the localization audit/decisions, Swahili review list, migration/deployment notes, and informational Kenya compliance checklist.
- Preserved the original MIT license and attribution. Mobile-money, wallet-ledger, and production payout integrations remain future work; KYC collection is gated pending privacy and retention readiness.
- Added the gated KYC submission and audited admin review workflow.
- Added a bounded, synthetic recruitment risk lab for contribution and liability analysis; it does not touch live balances or providers.

# Unreleased

- Localized known payout method and status labels in affiliate payout history and its CSV export; historical provider records remain display-only.
- Localized affiliate reports in English and Swahili, including report controls and CSV headers; reporting month buckets now use East Africa Time.
- Added account phone verification with five-minute hashed OTPs, per-account and per-IP throttling, attempt limits, and a phone verification audit event.
- Added an Africa's Talking SMS provider adapter with sandbox default and Resend email fallback.
- Added English and Swahili verification controls to affiliate settings and SMS environment wiring for Docker Compose.
