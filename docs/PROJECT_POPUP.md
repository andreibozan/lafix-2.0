# Proiectul tău — 27 October 2026

The homepage primary button and illustration caption open a native modal dialog with a branded hero illustration, service selection, and a second step using the existing authenticated request API. Native dialog behavior provides background inertness, focus containment, Escape dismissal and trigger focus restoration. Closing the dialog or switching between steps preserves the mounted form draft for this page visit; nothing is stored in browser storage.

Changed: app/project-popup.tsx, app/page.tsx, app/request-form.tsx, app/style.css, tests/e2e/project-popup.spec.ts (paths relative to apps/web except tests).

Verified: production Next build/type checking; 4 unit/HTTP smoke checks. Live in-app browser checks at 390×844 and 1280×900 confirmed service carryover, preservation of a synthetic locality when going back, and Escape dismissal returning focus to the trigger. Temporary viewport override restored. Two Playwright cases were added and discovered but the standalone Chromium runner was not rerun; previous sandbox limitations still apply. Authenticated database submission remains pending as documented in STATUS_V06.md.
