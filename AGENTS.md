# LaFix Codex project instructions

You are building LaFix, a Romanian two-sided marketplace for local services. Maintain a **single Expo React Native mobile application** with role-based client/provider UX, a **Next.js web application** for the public site and administrative dashboard, and one shared PostgreSQL backend.

## Repository map
- `apps/web`: Next.js 15 App Router, API route handlers, Prisma models and admin panel.
- `apps/mobile`: Expo 54, React Native client/provider app.
- `docker-compose.yml`: local PostgreSQL.
- `docs/`: roadmap, product decisions and acceptance criteria.

## Hard rules
1. Never use, add or require Polsia infrastructure.
2. Do not claim functionality works until it has been run and tested.
3. Treat all existing code as **unverified development MVP**. Preserve behavior while fixing security and correctness defects.
4. Do not commit `.env`, credentials, personal data, service keys, database dumps or generated build artifacts.
5. Respect Romanian language (ro-RO) for customer-facing interfaces.
6. Enforce role-based authorization **on the server** for CLIENT, PROVIDER, ADMIN; never trust UI-only restrictions.
7. Limit lead matching to **maximum 3 approved providers per request**, including concurrent requests.
8. Persist domain state in PostgreSQL and use Prisma migrations (avoid destructive schema pushes for production).
9. Keep GDPR privacy, consent, account deletion, audit logging and data minimization visible in product planning.
10. Before production deploy require tests, email verification, password reset, rate limits, CSRF protection, secure cookies, MFA for admins, backups and monitoring.

## Local developer sequence
- Read `README.md` and `docs/CODEX_TASKS.md`.
- `npm install`; `docker compose up -d db`; configure `.env` from examples; `npm run db:generate`; `npm run db:push`; `npm run dev`.
- For mobile set `EXPO_PUBLIC_API_URL` to reachable dev server (not localhost on a physical device); `npm run start -w apps/mobile`.
- First task: reproduce build/runtime errors, document them, fix them, add automated tests.
- Once green, implement backlog items in `docs/CODEX_TASKS.md` in order.
- Summarize each change with files touched, commands executed, test results, blockers and next step.
