# Oportunități calificate și Pro — 27 October 2026

## Scope and launch state

This implements the development/sandbox marketplace monetization workflow, not a live payment service. No real money, card data, payment accounts, external messages or customer records were used. BILLING_MODE defaults to disabled. Only an explicit BILLING_MODE=sandbox enables simulated wallet funding, paid lead unlocking, simulated Pro activation, and credit refunds. There is no live checkout, payment-provider webhook, invoice generation, automatic recurring charge, or real-money refund implementation. Do not advertise a production subscription as available yet.

Commercial pilot assumptions (not validated market prices): 20 RON per qualified opportunity; optional Pro at 129 RON per 30 days. Provider prices are integer bani in lib/monetization.mjs. Pro does not include opportunity credits, does not purchase approval/ranking, and does not change the maximum of three assigned providers. Customers remain free.

## Implemented user journeys

- /prestatori: public responsive pricing page, qualification explanation, Starter/Pro comparison, and an explicitly fictitious interactive unlock example. The public example is component-local presentation state; it never credits a real account or calls the payment API.
- Admin: views request details and private contact data; confirms contact, present intent and adequate details with an audit note before qualification. Matching rejects unqualified requests.
- Approved provider: sees assigned, structured previews and server-controlled prices. Free-text descriptions and contact data are excluded from locked API responses (descriptions can contain personal data). The provider confirms a single unlock debit before contact/details become available and an offer can be submitted.
- Wallet: simulated funding, ledger, optional Pro activation for 30 days and a non-renewal preference. No demo plan renews automatically. Insufficient balance rolls back the entire operation.
- Pro: server-checked expiry, counts of unlocked opportunities/offers/accepted offers, up to 20 saved offer templates and template reuse during bidding. Cancellation preference preserves access to the end of the purchased period.
- Provider reports an invalid contact, duplicate or false request. One report per allocation is stored for administrative analysis. A report alone does not issue credit.
- Admin: reviews reports and can refund an unlocked lead with a reason and audit note. A unique ledger reference prevents duplicate refunds; refunded access is revoked and pending offers are rejected. Refunding accepted/closed work is blocked pending a separate dispute process. Existing unlocked opportunities must be refunded before a request can be rejected.
- The single Expo app retains both roles and now supports lead unlock confirmation, wallet display, sandbox funding, Pro activation/non-renewal, Pro counts and saved-template reuse. Template creation and report handling are available on web.

## Persistence and concurrency

Migration: prisma/migrations/202610270001_monetization/migration.sql, relative to apps/web. It adds request qualification, unlock/refund state, provider wallet/Pro expiry, ledger, templates and audit events. Integer bani and DB checks prevent negative balances and nonpositive quoted lead prices.

Financial mutations use complete serializable transactions with bounded P2034 retries. Lead unlock/refund acquire a request row lock before touching the provider balance, matching the existing domain lock order. Wallet funding/Pro activation lock the provider row. Ledger references enforce idempotency: unlock/refund use the match id, sandbox operations use provider/action/request UUID. Existing unlocks do not charge again. Pro activation atomically debits and sets the expiry. No external call occurs inside a retried transaction.

The initial and new migrations are for the development schema. Existing schema-push databases need deliberate baselining. Old requests default to PENDING, old assignments are not silently treated as paid, and old paid entitlements are not grandfathered. Never migrate sandbox credits into a live-money environment; use a separate clean production database after security review.

## API additions

- GET /api/provider/billing; PATCH to record non-renewal preference.
- POST /api/provider/billing/demo: action TOPUP or PRO plus an idempotencyKey UUID. Amounts/duration come from the server.
- POST /api/provider/leads/:requestId/unlock.
- POST /api/provider/leads/:requestId/report: supported reason and note.
- GET/POST /api/provider/templates: approved provider with active Pro; mutations respect a cap of 20.
- POST /api/admin/requests/:id/qualify: decision and verification assertions/note.
- POST /api/admin/matches/:matchId/refund: supported reason and note.

All mutations check write origin and database-backed roles; provider mutations enforce ownership/approval. Approval, qualification, unlock, funding, Pro actions, reports and refunds leave audit events. No public route grants Pro, balance or contacts based on browser state.

## Verification performed

- Prisma client generation and schema validation passed; validation used a synthetic DATABASE_URL only and did not connect to a database.
- Production Next build/type checking passed (23 generated pages).
- Eight unit/HTTP checks passed against the local production server, including new authorization/CSRF routes, Pro expiry boundary, closed/refunded lead rules and contact-free previews.
- Expo iOS and Android JavaScript/Hermes exports passed. Native compilation/physical-device purchase behavior was not tested.
- In-app browser: fictitious unlock confirmation, balance reduction/contact reveal, and responsive Starter/Pro pricing at 390 and 1280 pixels were inspected.
- Eight Playwright cases are discoverable, including pricing/demo and the revised full workflow. The standalone runner was not rerun after its previous macOS sandbox launch denial.
- Real PostgreSQL migration/integration execution remains pending, as previously requested. The updated integration suite covers qualification, approval, locked contact privacy, insufficient funds, unauthorized unlocks, concurrent idempotent top-ups/unlocks/Pro activation/refunds, report deduplication, bidding, ownership, competing acceptance and logout revocation. These are authored tests, not passing-runtime claims.

## Reproduction with a disposable PostgreSQL database

Use the existing README setup, a separate empty lafix_test database and synthetic users only. Set DATABASE_URL and AUTH_SECRET through the ignored environment. Set BILLING_MODE=sandbox for the Next server. Then run:

```
npm ci
npm run db:generate
npm run db:migrate
npm run typecheck
npm run build
npm run start -w apps/web
```

From another terminal with the same DATABASE_URL and TEST_BASE_URL=http://localhost:3000:

```
npm test
npm run test:integration
npm run test:e2e
```

CI now sets BILLING_MODE=sandbox against its disposable PostgreSQL service. No hosted CI run was launched in this task.

## Before real monetization

Complete and pass PostgreSQL/CI/device tests; independently review authorization, transactional correctness and privacy; add a live payment processor using signed/idempotent webhooks as the only source of paid credits/entitlements; handle payment/refund failures and reconciliation; define tax/invoice/subscription and cancellation terms; verify email/phone; implement rate limits, admin MFA, retention/deletion, backups and monitoring; resolve the previously documented dependency advisories. Manual contact qualification is not automated identity verification, and the preview makes no promise of a won job.
