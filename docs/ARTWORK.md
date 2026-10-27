# LaFix homepage artwork

The hero was created with the built-in imagegen tool and saved as `apps/web/public/illustrations/lafix-neighborhood.png`.

The original house artwork was extracted from the inline `HeroArtwork` SVG in the supplied `lafix.zip`, `src/app/(setup)/page.tsx`. Only the artwork was reused; no original infrastructure, email integrations, or dependencies were imported. The standalone asset is `apps/web/public/illustrations/lafix-original-houses.svg`.

## Final generation prompt

Use case: illustration-story. Asset type: premium editorial website hero illustration for LaFix, Romanian local home services marketplace. Primary request: professional custom illustration of a welcoming Romanian neighborhood home being improved by local craftspeople: one woman homeowner with a clipboard talking to a friendly carpenter holding a small toolbox, a second professional carefully painting a wall beside a terracotta-roofed house, a tiny garden and warm sun. Sophisticated flat gouache / screenprint editorial illustration with precise organic shapes, subtle paper grain, restrained dark forest-green outlines. Colors forest green #194d3b, sage #a6bea1, warm ivory #f5f2e9, terracotta #d47b55 and small mustard accents. Square composition, airy pale ivory background matching #f5f2e9, visually balanced central vignette, all figures and house fully inside margins. Human natural proportions, tasteful modern European visual identity, no 3D, no gradients, no stock-photo look, no text, no letters, no logos, no watermark. Crisp usable final web illustration.

## Verification

Next.js production build and TypeScript check passed. In-app browser inspection confirmed both illustrations render, the Panouri solare service card preselects that category in the request form, and the provider CTA opens registration with the provider role selected. The preview remains local. Existing database/security release limitations in STATUS_V06.md still apply.
