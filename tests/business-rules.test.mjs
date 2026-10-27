import test from 'node:test';
import assert from 'node:assert/strict';
import { matchingSlots, canSubmitOffer, canAcceptOffer } from '../apps/web/lib/business-rules.mjs';
test('maximum 3 matches per request', () => {
  assert.equal(matchingSlots(0), 3);
  assert.equal(matchingSlots(2), 1);
  assert.equal(matchingSlots(3), 0);
  assert.equal(matchingSlots(9), 0);
  assert.throws(() => matchingSlots(-1));
});
test('only approved matched providers may send offers', () => {
  const approved = {role:'PROVIDER',providerStatus:'APPROVED',matched:true,requestStatus:'MATCHED'};
  assert.equal(canSubmitOffer(approved), true);
  assert.equal(canSubmitOffer({...approved,providerStatus:'SUSPENDED'}),false);
  assert.equal(canSubmitOffer({...approved,matched:false}),false);
  assert.equal(canSubmitOffer({...approved,requestStatus:'ACCEPTED'}),false);
});
test('client can only accept their own pending offer for quoted request', () => {
  const valid={role:'CLIENT',ownedByClient:true,offerStatus:'SENT',requestStatus:'QUOTED'};
  assert.equal(canAcceptOffer(valid),true);
  assert.equal(canAcceptOffer({...valid,ownedByClient:false}),false);
  assert.equal(canAcceptOffer({...valid,offerStatus:'REJECTED'}),false);
  assert.equal(canAcceptOffer({...valid,requestStatus:'CANCELLED'}),false);
});
