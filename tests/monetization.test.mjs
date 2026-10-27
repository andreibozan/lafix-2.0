import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activePro,canUnlock,leadPreview,formatRon} from '../apps/web/lib/monetization.mjs';
test('Pro expires at the exact boundary, cancellation does not remove paid access early',()=>{
 const end=new Date('2026-11-01T00:00:00Z');
 assert.equal(activePro({proUntil:end,proCancelled:true},new Date(end.getTime()-1)),true);
 assert.equal(activePro({proUntil:end},end),false);
 assert.equal(activePro({proUntil:null},new Date()),false);
});
test('closed, unqualified and refunded opportunities cannot be sold',()=>{
 for(const status of ['ACCEPTED','CLOSED','CANCELLED'])assert.equal(canUnlock({qualification:'QUALIFIED',status},{}),false);
 for(const qualification of ['PENDING','REJECTED'])assert.equal(canUnlock({qualification,status:'OPEN'},{}),false);
 assert.equal(canUnlock({qualification:'QUALIFIED',status:'MATCHED'},{refundedAt:new Date()}),false);
 assert.equal(canUnlock({qualification:'QUALIFIED',status:'QUOTED'},{}),true);
});
test('locked previews never reuse free text or client contact data',()=>{
 const request={category:'Renovări',locality:'Deva',county:'Hunedoara',description:'Contact secret 0712345678 private@example.invalid',contactEmail:'private@example.invalid',contactName:'Nume privat'};
 const preview=leadPreview(request);assert.match(preview,/Deva/);assert.doesNotMatch(preview,/0712345678|private@|Nume privat|Contact secret/);
});
test('integer bani format as RON without losing precision',()=>{
 assert.match(formatRon(2000),/20,00/);assert.match(formatRon(12900),/129,00/);assert.match(formatRon(-2000),/-20,00/);
});
