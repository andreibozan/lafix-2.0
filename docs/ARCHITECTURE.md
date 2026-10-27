# LaFix architecture (target)

```text
                 apps/mobile (Expo iOS/Android)
                           |
                           v
apps/web (Next.js public + admin + route handlers)
                           |
                       Prisma ORM
                           |
                      PostgreSQL
```

**Current state:** API and website are in `apps/web`; Expo mobile talks to the same API. There is no verified deployment. The repo is a development starter, not a ready-to-publish mobile app.

**Roles:** CLIENT submits requests and accepts offers, PROVIDER has a reviewed profile and can bid on assigned leads, ADMIN approves providers and controls matching. Authorization must be enforced for every endpoint.

**State:** A request belongs to a client. Admin assigns up to three approved providers. A provider can submit an offer only for an assigned request. Client can accept only one offer per request.

**Infrastructure:** independently owned GitHub repository, cloud host for web/API, managed PostgreSQL, transactional email and push provider. API secrets never appear in Expo `EXPO_PUBLIC_` settings.

**Migration:** This is a ground-up successor. Do not migrate personal information from Polsia without an authorized secure process and privacy review.
