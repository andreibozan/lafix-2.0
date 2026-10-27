import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freeMarketplace,canAccessMatch} from '../apps/web/lib/marketplace-access.mjs';
test('launch defaults to free access but only for an assigned qualified match',()=>{
 assert.equal(freeMarketplace({}),true);
 assert.equal(freeMarketplace({MARKETPLACE_MODE:'free'}),true);
 assert.equal(canAccessMatch({}, {qualification:'QUALIFIED'}, {}),true);
 assert.equal(canAccessMatch(null,{qualification:'QUALIFIED'},{}),false);
 assert.equal(canAccessMatch({}, {qualification:'PENDING'},{}),false);
 assert.equal(canAccessMatch({refundedAt:new Date()}, {qualification:'QUALIFIED'},{}),false);
});
test('paid mode remains explicit and preserves the unlock boundary',()=>{
 const env={MARKETPLACE_MODE:'paid'};
 assert.equal(freeMarketplace(env),false);
 assert.equal(canAccessMatch({}, {qualification:'QUALIFIED'},env),false);
 assert.equal(canAccessMatch({unlockedAt:new Date()}, {qualification:'QUALIFIED'},env),true);
});
