> Latest verification and environment blockers: [STATUS_V06.md](STATUS_V06.md). Remaining checkboxes require actual runtime verification.

# Codex execution backlog — LaFix 2.0

## P0: make the existing MVP actually runnable
- [x] Run npm install with a suitable online Node.js 20+ environment, and capture package versions/lockfile.
- [ ] Run Prisma generate, typecheck, Next.js build, Expo diagnostics and start both clients. Fix all errors.
- [ ] Boot PostgreSQL from Docker Compose, create a throwaway development DB and exercise migrations.
- [ ] Add reproducible automated tests for auth, role authorization, request creation, provider approval, matching, offers and acceptance.
- [ ] Test a complete path: provider registers -> admin approves -> client requests -> admin matches <=3 -> provider offers -> client accepts.
- [ ] Document reproducible commands and verified outputs in README; distinguish tests that were not run.

## P1: correctness and security needed before public beta
- [ ] Formalize backend API contracts and validation with Zod for all user-supplied fields.
- [ ] Address authentication expiry, revocation, password reset, email verification, login brute-force rate limiting and safe error handling.
- [ ] Implement end-to-end protection for authenticated browser mutations (cookie security, Origin/CSRF defense) and strict CORS policy for Expo bearer-token calls.
- [ ] Enforce role checks and ownership checks in all query/mutation endpoints; test IDOR attacks.
- [ ] Review matching concurrency, rollback/retry semantics, duplicate bids, only one accepted offer and request statuses.
- [ ] Add structured logs, audit trail for provider reviews/admin actions and basic monitoring.
- [ ] Publish privacy terms, consent management, retention/deletion mechanisms; collect the minimal required user details.

## P2: product completion
- [ ] Build polished mobile navigation and reusable UI components for client and provider.
- [ ] Build provider onboarding/profile (services, location, radius, portfolio, verification).
- [ ] Build client request management, offer comparison, status history and cancellation flow.
- [ ] Build admin queue/search/filter dashboard with oversight and abuse controls.
- [ ] Add transactional email and mobile push notifications using independently owned vendor accounts.
- [ ] SEO, accessibility and performance improvement for the public website.

## P3: release preparation
- [ ] Automated CI with Prisma + API tests + web build, staging with separate DB and secrets.
- [ ] Backup/restore rehearsal and smoke tests on staging.
- [ ] Expo EAS build for iOS/Android; test on physical devices.
- [ ] Store listing assets, privacy disclosures, account deletion, support email and store submission.
- [ ] Optional paid provider plans only after supply-demand marketplace validation.

## Acceptance criteria for first milestone
A new developer can clone the repository and, following README, run the website/API, database and Expo app; CI is green; the complete client/provider/admin scenario passes automated integration tests; no real user data or secrets are committed.

## v0.5 handoff — next verified milestones

- Install dependencies and generate a committed `package-lock.json`; CI uses `npm ci`.
- Boot PostgreSQL with Docker, `npm run db:push`, then validate the real client/provider/admin journey.
- Implement persistent sessions (revoke on logout), email verification, login throttling, audit logs and admin MFA before public launch.
- Make offer acceptance resilient to concurrent requests with integration tests using real PostgreSQL.
- Add Playwright browser E2E tests and Expo Android/iOS device testing.
- Never publish `.env`, PostgreSQL exports or API credentials.
