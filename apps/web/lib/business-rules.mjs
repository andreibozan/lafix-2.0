/** Pure business rules shared by backend and dependency-free tests. */
export const MAX_PROVIDERS_PER_REQUEST = 3;
export function matchingSlots(existingCount) {
  if (!Number.isInteger(existingCount) || existingCount < 0) throw new TypeError('Invalid match count');
  return Math.max(0, MAX_PROVIDERS_PER_REQUEST - existingCount);
}
export function canSubmitOffer({ role, providerStatus, matched, requestStatus }) {
  return role === 'PROVIDER' && providerStatus === 'APPROVED' && matched === true &&
    ['OPEN', 'MATCHED', 'QUOTED'].includes(requestStatus);
}
export function canAcceptOffer({ role, ownedByClient, offerStatus, requestStatus }) {
  return role === 'CLIENT' && ownedByClient === true && offerStatus === 'SENT' && requestStatus === 'QUOTED';
}
