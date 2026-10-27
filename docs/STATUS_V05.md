# LaFix v0.5 — validated scope

This handoff extends the previous Codex-ready ZIP; it is not a launched service.

## Changes
- Prevent suspended/unapproved providers from listing their offers.
- Restrict offer list to CLIENT/PROVIDER (admins cannot read the client list via that endpoint).
- Reject acceptance of any offer not in SENT state.
- Production cookie write-origin checks require APP_ORIGIN.
- Dependency-free business-rule tests for match cap and offer authorization semantics.

## Important limitations
- Unit tests check pure reference business rules, not live API endpoints or database transactions.
- Database and HTTP API integration tests are pending.
- Neither the website nor mobile app has been deployed or exercised end to end.
- Token invalidation, email validation, rate limiting, MFA and audit logs are not implemented.
- Do not use with production users or personal data without security review.
