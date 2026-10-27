// Free is the launch default. Paid access must be explicitly enabled later.
export function freeMarketplace(env = process.env) { return env.MARKETPLACE_MODE !== 'paid'; }
export function canAccessMatch(match, request, env = process.env) {
  return !!match && !match.refundedAt && request?.qualification === 'QUALIFIED' &&
    (freeMarketplace(env) || !!match.unlockedAt);
}
