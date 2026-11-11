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
- The public landing page and funding transparency page, login and registration, admin/affiliate navigation, account menus, dashboard greetings, main dashboard content, affiliate referrals/payouts, and admin payouts/invoices, customers, team, and settings screens have translation work in progress. API-originated error messages and remaining secondary screens still need localization. Draft Swahili business terminology remains flagged for native-speaker review in `docs/SWAHILI_REVIEW_NEEDED.md`.
- Lint now uses ESLint 9 and the matching Next.js flat config. The first full-repository run reports 167 errors and 103 warnings across existing and changed files, so full lint acceptance remains open pending cleanup. The newly added landing/PWA components, public routes, and tests pass a targeted lint run. A Node test runner command covers core currency arithmetic/formatting and Nairobi date formatting; referral, ledger, budget, provider callback, and end-to-end invariants are still unimplemented. Docker production build runs Next.js TypeScript validation and the current unit tests.

## Phase 3: phone registration progress

- New registrations require a Kenyan mobile number accepted by `libphonenumber-js`, normalize it to E.164, encrypt it at rest, and use a keyed hash for uniqueness. The additive migration keeps these fields nullable for existing accounts and adds a nullable phone verification timestamp. Configure and retain a stable `PII_MASTER_KEY` before production.
- Phone verification is implemented as a separate authenticated account-settings flow: Africa's Talking SMS when configured, otherwise Resend email fallback. The account login flow remains email OTP. Do not treat phone presence as verification; only the verified timestamp records successful possession checks.
- Registration stores Kenya as the country code and optionally accepts one of the 47 Kenyan counties. `src/lib/country-config.ts` is the extension point for per-country currency, locale, timezone, phone prefixes, payment availability, and tax settings; M-Pesa, Airtel Money, and withholding are configured disabled until implemented and approved.
- Affiliate settings can update the optional county against the same 47-county allowlist. The profile API returns only phone-presence and verification booleans; encrypted phone material is never returned to the browser. Country selection remains Kenya-only until another country configuration and its locale/payment rules are implemented.
- KYC fields use a separate derived encryption key and keyed document hash. Submission requires recorded user consent and is disabled unless `KYC_SUBMISSIONS_ENABLED`, a published `KYC_PRIVACY_NOTICE_URL`, and `KYC_REVIEW_WORKFLOW_ENABLED` are all configured. Admin queue/detail/decision routes exist and audit identity-detail access and decisions. Retention controls, a reviewed privacy notice, and legal review remain prerequisites; do not enable collection until those exist. Phone verification and all higher transaction limits remain unavailable.
- The admin recruitment risk lab uses generated cohorts and fixed illustrative assumptions only. It is bounded to eight generations, performs integer-minor-unit arithmetic, records aggregate simulation inputs/results in the audit log, and has no integration with live participants or balances. The formula and omitted factors are documented in `docs/RECRUITMENT_RISK_LAB.md`.
- Affiliate reports now use the English/Swahili catalogue for report controls, headings, tables, and CSV headers. Report month buckets are calculated in `Africa/Nairobi` so records near UTC month boundaries appear in the expected Kenyan reporting month.
- Affiliate payout history now translates known payout method and status values, including legacy methods retained on historical records. The display mapping does not enable or initiate any payment method.

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
- The public landing page describes the current preview honestly: deposit collection, mobile-money payments, and withdrawals are not enabled. The funding page does not assert unverified company revenue or custody arrangements.
- The PWA manifest and offline navigation fallback are installed. The service worker caches only the static offline document; it does not cache account pages, API responses, or transaction data.
- The landing page emits FAQPage and Organization structured data, and public sitemap/robots routes are present. Landing and funding-disclosure URLs now have `en-KE`/`sw-KE` paths, localized metadata, hreflang alternates, and sitemap entries. Other public routes still use the browser-persisted locale selector without localized URLs.
- Affiliate profile settings now default new profiles to Kenya, preserve existing stored countries, translate the main settings form, and no longer claim payout details are encrypted. M-Pesa is explicitly shown as unavailable; legacy stored payout methods remain visible only as saved values.
# Phone verification delivery

Kenyan phone numbers are collected at registration, encrypted at rest, and remain explicitly unverified until an authenticated user confirms a one-time code. Phone verification uses Africa's Talking only when `SMS_PROVIDER=africas_talking` and credentials are configured; otherwise, or when the SMS request fails, the code is sent to the account email using Resend. Codes are stored only as purpose-separated HMAC digests, expire after five minutes, and permit at most five verification attempts. Send and verify endpoints are rate-limited by both account and IP. Provider payloads, phone numbers, and codes are not written to application logs. These controls verify possession of a phone number; they do not authorize financial services.

The Africa's Talking adapter defaults to sandbox. Production SMS requires setting `AT_ENV=production` and valid provider credentials in the runtime environment. No SMS provider is enabled by default.
