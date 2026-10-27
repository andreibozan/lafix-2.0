import {test} from 'node:test';
import assert from 'node:assert/strict';
import {retryableTransactionError, withTransactionRetry} from '../apps/web/lib/transaction-retry.mjs';
test('retries raw PostgreSQL serialization conflicts as well as Prisma write conflicts', async () => {
  const conflicts = [{code:'P2010',meta:{code:'40001'}}, {code:'P2034'}, {code:'P2010',meta:{code:'40P01'}}];
  let attempts=0;const waits=[];
  const result=await withTransactionRetry(async()=>{const error=conflicts[attempts++];if(error)throw error;return 'committed'},async ms=>{waits.push(ms)});
  assert.equal(result,'committed');assert.equal(attempts,4);assert.equal(waits.length,3);assert.ok(waits.every(ms=>ms>=10&&ms<=219));
});
test('never retries validation, unique constraints or arbitrary raw SQL errors, and bounds contention retries', async () => {
  for(const error of [new Error('validation'),{code:'P2002'},{code:'P2010',meta:{code:'42601'}}]){
    let attempts=0;await assert.rejects(withTransactionRetry(async()=>{attempts++;throw error},async()=>{}),e=>e===error);assert.equal(attempts,1);assert.equal(retryableTransactionError(error),false);
  }
  let attempts=0;const conflict={code:'P2034'};await assert.rejects(withTransactionRetry(async()=>{attempts++;throw conflict},async()=>{}),e=>e===conflict);assert.equal(attempts,9);
});
