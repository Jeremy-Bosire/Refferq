# Localization decisions

This file records implementation defaults and unresolved choices for the Kenya-first localization work.

## Phase 1: money, dates, and existing data

- New monetary values use integer minor units: 100 units per KES. Existing Prisma `*Cents` column/property names are retained during this first migration to avoid a risky rename; their values are interpreted as minor units.
- KES (`en-KE`) is the display/default currency for new program, conversion, invoice, and coupon records. Existing row currency values are preserved. No historical INR/USD/EUR/GBP amount is relabeled as KES and no foreign-exchange rate is guessed.
- A record with a currency field should be formatted in that record's currency. Where old referral estimate metadata does not identify a currency, the estimate is not shown as KES and requires review before approval.
- New referral estimates are stored as `estimated_value_minor`. Fixed commission-rule and coupon values use PostgreSQL `DECIMAL(18,4)` until their schema can be migrated to explicit integer minor-unit fields; percentage rates remain rates, not balances. Monetary rate application uses integer basis-point arithmetic.
- Timestamps remain UTC in storage. User-facing dates use `Africa/Nairobi`; the default full-date format is `DD/MM/YYYY`. Month labels and date-time displays may use a shorter form where space or report grouping requires it.
- The Phase 1 SQL files are incremental for a database already created from the current schema. This repository had no migration baseline when work started. A baseline and documented existing-database adoption procedure are required before using `prisma migrate deploy` for either fresh installations or the current persistent Docker volume.

## Phase 2: locale selection

- Use the requested `en-KE` and `sw-KE` locale identifiers. English is the initial default; a user's browser selection is stored locally and updates the document `lang` attribute.
- The existing app has hundreds of embedded English strings and no i18n package. A small typed in-app catalogue is being used as the equivalent foundation, with extraction proceeding screen group by screen group. Do not treat untranslated screens or backend-generated messages as completed localization.
- Login and registration, admin/affiliate navigation, account menus, dashboard greetings, main dashboard content, affiliate referrals/payouts, and admin payouts/invoices, customers, team, and settings screens have translation work in progress. API-originated error messages and remaining secondary screens still need localization. Draft Swahili business terminology remains flagged for native-speaker review in `docs/SWAHILI_REVIEW_NEEDED.md`.
- The configured lint command is `next lint`, which is incompatible with the installed Next.js 16 CLI; there is no project-wide unit/integration test command. Docker production build runs Next.js TypeScript validation. Lint and test acceptance remain open until scripts and test coverage are added.

## Financial product boundaries

- Localization work does not turn deposits into revenue, make deposits reward triggers, or calculate returns/yield on deposits. Deposited customer funds must remain distinguishable from earned revenue and rewards.
- Reward, payment, and withdrawal behavior is not expanded by the currency/date changes. Any future rewards should be tied to verifiable qualifying activity, have a hard budget, and preserve the agreed referral-depth cap.
- The requested deposit-funded reward and returns-on-deposits model is not specified or enabled here. It would require qualified Kenyan legal/accounting review and an approved, documented custody and funding arrangement before implementation or public promotion. This is an implementation boundary, not a legal conclusion.

## Runtime fixes discovered during localization

- Authenticated identity is forwarded to route handlers as request headers; setting it only on the response leaves handlers without `x-user-id`.
- The admin dashboard's top-affiliate API exposes `totalEarnings`; the UI must format that field rather than the nonexistent `totalRevenue` field.
- Auth cookies use `Secure` when the configured app URL is HTTPS. Local Docker access via HTTP uses a non-secure cookie so browsers can retain the session.

## Phase 9/11 implementation defaults

- Public UI identity reads `NEXT_PUBLIC_BRAND_NAME` and `NEXT_PUBLIC_BRAND_PRIMARY_COLOR`, defaulting to GanjiLink and blue. Operational/legal details remain blank until verified.
- `.env.example` contains variable names and empty provider credentials only. Daraja and SMS integrations remain disabled until adapters, provider onboarding, and safeguarding checks are complete.
- `docs/COMPLIANCE_CHECKLIST.md` is an informational launch checklist and requires review by Kenyan counsel and qualified advisers.
