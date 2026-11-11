# GanjiLink Localization Audit (Phase 0)

**Audit date:** 11 November 2026
**Scope:** `README.md`, `package.json`, `prisma/schema.prisma`, `.env.example`, `next.config.js`, `vercel.json`, `docker-compose.yml`, `docs/`, and all of `src/`. `frontend-old/` was checked as legacy.

## Repository state and scope notes

- The checked-out branch is `feat/kenya-localization`.
- `package-lock.json` and `src/middleware.ts` were already modified before the localization work. The middleware now also contains a reviewed authentication fix from this branch; the lockfile edits remain unrelated and are not part of the localization changes.
- `frontend-old/` does not exist in the repository. No imports/references to it were found; the only `frontend-old` text is an exclusion in `tsconfig.json`.
- The app is Next.js App Router with Prisma/PostgreSQL, React, JWT authentication, Resend email, and no `stripe` SDK dependency. A complete path-by-path application audit should still be maintained as each phase changes the affected areas; the scan findings below identify the migration hotspots.

## Findings

### Currency and money representation

- `src/lib/currency.ts` supports USD, EUR, INR, GBP, CAD, AUD, defaults to USD, and formats via a hand-built symbol plus `toLocaleString`.
- User-facing Indian defaults and rupee symbols are widespread in admin and affiliate dashboards, invoices, coupon/program settings, email output, report APIs, and defaults. Examples include `src/app/admin/page.tsx`, `src/app/admin/program-settings/page.tsx`, `src/app/affiliate/page.tsx`, `src/lib/email.ts`, and `src/app/api/admin/settings/route.ts`.
- USD defaults also appear in webhook/conversion APIs and `Conversion.currency`. USD `$` remains in currency helpers, admin currency choices, docs, and email provider pricing references. Documentation contains EUR/GBP examples too.
- Prisma stores many amounts as integer fields named `*Cents` (`Affiliate.balanceCents`, `Conversion.amountCents`, `Commission.amountCents`, `Payout.amountCents`, `Transaction.amountCents`, invoice amounts); these are workable integer minor units, but historical names/default assumptions refer to cents/paise and need a data-preserving migration to KES cents (100 cents per KES). `Referral` estimated values are held in JSON metadata and API/UI numbers, not a dedicated typed money column. `Commission.rate`, rule values, commission rates, and coupon discount values are `Float`; those are rates/percentage or discount values rather than ledger balances, but monetary fixed discounts should be integer minor units and rate calculations must use deterministic integer arithmetic.
- There is no wallet ledger. `Affiliate.balanceCents` is a mutable balance field. Commission creation and payout flows update balances directly in application code.
- Phase 1 should centralize all rendered amounts in a `formatMoney` helper using `Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' })`; retain integer minor units and replace floating point monetary calculations.

### Locale, date, and number formatting

- No i18n framework or locale routing is present. User-facing copy is predominantly English and embedded in React components, APIs, and email templates.
- Dates and numbers use mixed `en-IN`, `en-US`, host-default locale, `toFixed`, and raw `toLocaleString` calls across admin, affiliate, and email code. There is no consistent timezone handling or EAT display policy.
- Implement locale-aware strings for `en-KE` and `sw-KE`; store timestamps in UTC and render `Africa/Nairobi` with `DD/MM/YYYY` display conventions. Ensure date-only filters and report boundaries are computed in EAT.

### Branding and domains

- “Refferq”/`refferq.com` appears in README, package metadata, `.env.example`, Docker/Vercel naming, defaults in route handlers, email code/docs, tracking SDK/docs, and UI snippets. The MIT `LICENSE` and original copyright notice must remain intact; rebranding should not rewrite attribution.
- README contains Buy Me a Coffee, Open Collective, and Ko-fi links/badges. Remove these during branding cleanup as requested.
- Keep the legal license and attribution while moving product-facing naming, metadata, app URLs, email names, deployment names, and documentation to GanjiLink. Placeholder business/support/domain facts must remain clearly configurable and not be represented as verified claims.
- Current Phase 9 work adds configurable public UI branding and a sanitized `.env.example`; old references remain in email templates, API defaults, SDK snippets, package metadata, and docs and require further review.

### Phone, country, and identity

- `User` has email/name/password but no phone, phone-verification status, KYC, consent, or legal identity fields. `OTP` is email keyed.
- Optional `Referral.leadPhone` exists for submitted leads. Affiliate country and payout details are stored in a generic `payoutDetails` JSON field and edited in `src/app/affiliate/settings/page.tsx`; current UI defaults to India. No phone normalization/E.164 validation or SMS provider exists.
- `ProgramSettings.blockedCountries` stores a denylist JSON value; there is no allowlist or country configuration layer. Country handling is otherwise unstructured.
- Add phone verification, country config and Kenya allowlist, tiered KYC data with encryption/masking, and explicit consent/retention as separate audited schema changes.

### Payout methods and payment integrations

- Prisma `PayoutMethod` enum contains `PAYPAL`, `BANK_TRANSFER`, `STRIPE`, `WISE`, `BANK_CSV`, and `STRIPE_CONNECT`. Runtime profile/admin forms expose PayPal, Wise, bank, or Stripe variants; `Payout.method` itself is a free-form string. Program settings defaults to PayPal.
- No M-Pesa/Airtel integration exists. No Stripe SDK dependency is installed. Stripe appears in documentation, payment method enums/forms, example integrations, refund webhook commentary, and simulated seed payout details; there is no confirmed live Stripe payment execution in the audited dependencies.
- M-Pesa STK/B2C and optional C2B should be implemented behind explicit provider interfaces and environment configuration. Keep legacy providers disabled behind a feature flag and avoid displaying methods that are not configured and working.

### Email and SMS

- Email sending is implemented in `src/lib/email.ts` with Resend and large inline English HTML templates. `src/lib/otp.ts` also builds OTP email content. The admin can edit template subjects and bodies through `EmailTemplate` and `/admin/emails`.
- Several templates hardcode INR/₹ and Indian date/number formatting; payout copy assumes bank transfer or Stripe Connect. Docs describe old sender/provider setup. No SMS provider or localization catalogue exists.
- Localize email and validation/toast/API-facing text, preserve admin template editing safely, add Swahili review markers, and route SMS through an `SmsProvider` adapter.

### Referral and commission logic (including multi-level audit)

- Existing referral tracking is one affiliate attached to a referral, with conversions and commissions linked to that affiliate. There is no parent/referrer chain, referral depth/level field, ancestor traversal, or multi-level payout calculation in the Prisma schema or inspected `src/` flows.
- Existing commission logic is single-affiliate commission on conversion/lead/purchase, and admin approval can generate commissions. `CommissionRule` supports fixed/percentage commission rules. `PartnerGroup` and program settings also support different commission-rate groups; seed data includes “Enterprise Tier” and tier requirements. These are affiliate/program commission tiers, not multi-level referral rewards.
- The user clarified that three referral levels should be maintained. This supersedes the conflicting Phase 5 and acceptance criteria that say only level 1 may earn and that levels 2+ must be impossible. The reward-engine plan must support exactly three levels; the invariant suite and acceptance criteria must be revised to test the three-level cap instead.
- Deposits are not a feature or a reward trigger in the current code. Referral conversion is the only current commission path. The user clarified that deposits should count as revenue, generate rewards, and receive returns; these are requirements for future design, not existing behavior. The accounting, funding, custody, and return model needs an explicit legal and accounting review before implementation details are fixed.

### Stripe, blocked-country logic, and other gaps

- Stripe SDK package and Stripe secret keys in `.env.example`/README are present as optional legacy configuration, but the checked package manifest does not include the Stripe SDK. Existing payout UI/schema/docs still refer to Stripe. No general country-blocking service was found beyond the `blockedCountries` setting/schema.
- There is no wallet catalog, append-only double-entry ledger, payment collector, payout provider abstraction, budget cap, independent deposit/reward/withdrawal kill switches, reconciliation worker, KYC limit enforcement, PWA manifest/install flow, Swahili support, or compliance checklist in the current app.
- Money appears in API forms and reporting as both integer minor units and floating-point rates/JSON; there is no database constraint that balances ledger entries because no ledger exists.
- Phase 1 work now stores new manual referral estimates as integer `estimated_value_minor` JSON values, and reads historical major-unit estimates only when they carry an explicit `estimated_value_currency: "KES"` marker. Unmarked legacy estimates stay unconverted and are shown as unavailable; approval is blocked until their source currency is reviewed. Mixed fixed/percentage commission-rule and coupon values are moving from PostgreSQL floating point to `DECIMAL(18,4)` through an explicit migration, preserving stored values.
- The repository had no Prisma migration history before Phase 1. The new SQL migrations are incremental changes for an already provisioned PostgreSQL schema; a proper baseline is still required for brand-new database deployments before `prisma migrate deploy` can be the standard setup path.

### Phase 1 progress

- Shared KES-first formatting, minor-unit parsing and rate math, EAT date helpers, KES defaults for new records, and SQL migrations have been added. The localized admin and affiliate screens use these helpers for their principal money/date displays.
- Existing monetary rows have not been converted or relabeled. Their currencies must be inventoried before historical views can safely be consolidated to KES; display existing currency where its record has one and do not apply exchange rates implicitly.
- Verification so far: the Docker production build (including TypeScript) passes. A direct authenticated API check also returned successful responses for the admin dashboard endpoints. Full unit/integration/lint coverage remains outstanding.
- The audit and decisions must remain the source of truth for deferred historical-data mapping and migration-baseline work; do not claim a production migration has run merely because the image builds.

### Phase 2 progress

- A lightweight in-app locale provider now supports `en-KE` and `sw-KE`, persists the selected locale in browser storage, updates the document language, and exposes a language switcher in the admin and affiliate shells and auth pages.
- Login and registration screens, admin/affiliate navigation, account menu items, dashboard greetings, main dashboard content, affiliate referrals/payouts, and admin payouts/invoices are now in the message catalogue. API-originated error messages and most remaining secondary screens still need localization; Phase 2 is in progress, not complete.
- Swahili terms needing a native review are tracked in `docs/SWAHILI_REVIEW_NEEDED.md`.
- The current Docker production build and TypeScript check pass after the admin payouts/invoices translation slice. `npm run lint` is configured as `next lint`, which is unavailable in the Next.js 16 runtime container (`next: not found`); the repository has no general unit-test script. Repair/replace lint tooling and add test coverage in the CI/testing phase.

## Proposed implementation and Prisma migration plan

Keep each phase in a small, reviewable commit and generate explicit Prisma SQL migrations; do not use `db push` for production schema changes. Before data migrations, take a database backup and inventory production row counts and existing currencies. Preserve IDs, foreign keys, attribution, commissions, payouts, and audit history.

1. **Phase 0 branch and baseline:** Create `feat/kenya-localization` from the current `main` HEAD without discarding the already modified lockfile or middleware. Add this audit report. Continue preserving the user's edits in subsequent changes.
2. **Currency/data normalization:** Add canonical KES currency defaults and formatting. Determine the denomination and currency for every existing row before converting old values; do not mechanically reinterpret INR/USD values as KES. Where source currency is known, use an explicit conversion/retention policy and record the applied rate/date. Keep integer minor units; convert fixed coupon values and any monetary `Float`/JSON fields to integer minor units. Retain/rename `*Cents` fields with compatible SQL columns first, then rename application properties in a later migration if needed.
3. **Localization:** Add `en-KE` / `sw-KE` message catalogues and locale routing/switching. Extract strings incrementally, starting public/auth, then affiliate/admin, validation, notifications, and emails. Set one EAT-aware date/number formatter service.
4. **Identity/country:** Add nullable phone/E.164 and verification timestamps initially, then enforce required phone for new registrations after backfill/OTP flow is ready. Add country config, Kenya allowlist, optional county, KYC tier/status, encrypted legal-identity columns with key version, consent records, and retention metadata. Do not store raw ID values in logs.
5. **Ledger and wallet:** Add accounts, immutable journal transactions, balanced debit/credit entries, idempotency key uniqueness, actor/reference, deposit/purchase/refund/withdrawal/reward records, and derived balance queries. Introduce the ledger in shadow/read-only reconciliation mode, compare derived totals against existing affiliate balance/commission/payout records, then switch writes; never backfill fabricated wallet deposits from old commission balances.
6. **Payments and catalog:** Add provider-neutral deposit/payout records, provider request/receipt IDs with unique constraints, state machines, idempotent callback processing, limits/velocity controls, reconciliation records, catalog/products/orders/refunds, and admin-configurable PSP-held model. Enforce independent kill switches at service and route boundaries.
7. **Rewards:** Add attribution with a maximum depth of three, reward lifecycle/hold/clawback, monthly budget period/reservation/paid totals, freeze/review flags, and unique event idempotency. Include the user-requested deposit-based revenue/reward and deposit-return requirements in the product and ledger design after the applicable legal/accounting review. Rewrite the conflicting level-1-only acceptance criteria before implementation. Budget reservation must be transactionally locked so concurrent rewards cannot exceed budget.
8. **Payout, notifications, compliance, UX:** Add M-Pesa B2C and SMS adapters, EAT statements/tax configuration, legal/content records and audit trails, localized emails, PWA, GanjiLink theme/metadata, original landing page and FAQ, seed safety checks, operational docs and CI.

## Revised Phase 5: three-level referrals and deposit-linked rewards

This revision follows the user's latest direction and supersedes the original Phase 5 single-level wording.

- Support referral reward levels 1, 2, and 3 only. A deposit can trigger rewards for eligible ancestors up to level 3, subject to configured rules, available monthly budget, fraud checks, and kill switches. No reward may be issued at level 4 or beyond.
- Treat deposits as a revenue event for the requested product model and support deposit-linked rewards. Also support the requested returns-on-deposits feature as an explicitly configured product rule. Rates, eligibility, accrual timing, caps, source of funds, accounting treatment, reversals, and customer disclosures remain unset until approved through legal/accounting review; do not invent or advertise guaranteed returns.
- Keep reward lifecycle states, idempotency, hold/clawback, budget reservations, audit events, manual review, and account freezes. Budget enforcement remains mandatory across every reward trigger, including deposit events.
- Preserve the existing distinction between referral depth and commission-rate partner groups. Partner-group tiers do not increase the three-level referral limit.
- Before implementation, replace any single-level-only requirements and tests with three-level-cap tests. Preserve ledger balancing, idempotency, fraud controls, and independent kill switches.

## Revised acceptance criteria

These criteria replace the conflicting direct-only and no-deposit-reward criteria from the initial request. They describe requested behavior; production activation remains gated on the legal/accounting review above.

- Referral rewards may be generated for levels 1 through 3; no level 4+ reward can be created.
- A qualifying deposit event can create rewards under the configured rules, with duplicate callbacks producing no duplicate deposit credit, return accrual, or referral reward.
- The configured returns-on-deposits rule is represented in the ledger and customer statement with its approved calculation and disclosure; no undocumented rate or guaranteed-income claim is used.
- Total rewards issued in a monthly period never exceed the configured monthly budget, including deposit-triggered rewards and all three levels.
- Ledger postings balance after deposits, deposit returns, product purchases/refunds, rewards, and withdrawals; customer-visible balances reconcile to the ledger.
- Deposit/reward/withdrawal kill switches independently prevent new activity in their respective flows.
- Existing locale, KES formatting, OTP, payment sandbox, payout idempotency, privacy, and compliance acceptance criteria remain in force.

## Phase ordering risks and assumptions to record

- The user resolved the product direction in favor of three referral levels and deposit-linked revenue, rewards, and returns. The original Phase 5 and acceptance criteria still contradict this direction and need revision before they can be implemented or used as release gates.
- Deposit-linked rewards and returns create material financial, accounting, custody, and consumer-protection questions. Before implementing these code paths or making public claims, require qualified Kenyan legal and accounting review and confirmation of the payment/fund-holding arrangement. This audit records the requested direction but does not make legal determinations or prescribe return calculations.
- Activation fee defaults conflict (`MIN_PURCHASE_KES` is 550 in Phase 5; placeholder says 200). Keep the amount configurable and unset for production until product terms and the reward funding/budget policy are approved.
- A monthly budget placeholder is unspecified. Reward issuance must remain disabled until a positive budget is configured.
- Production fund custody and treatment require a verified provider/arrangement and legal/accounting review, particularly given the requested deposit revenue and return model. No legal status is assumed by this code audit.
- `package.json` currently specifies Next.js 16.2.6 rather than the project-context claim of Next.js 15. Next.js lint script uses the removed/changed `next lint` CLI in newer versions; validate the actual toolchain in the implementation phase.
- Current `main` has pre-existing uncommitted changes. Branch setup must retain them without including them accidentally in feature commits unless the owner wants them included.
