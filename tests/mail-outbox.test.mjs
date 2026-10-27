import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {mailConfigured,deliverOutbox} from '../apps/web/lib/mail-outbox.mjs';
import {seal} from '../apps/web/lib/account-crypto.mjs';
test('test email capture is allowed only on the isolated test database',()=>{
 const key=Buffer.alloc(32).toString('base64');
 assert.equal(mailConfigured({AUTH_ENCRYPTION_KEY:key,MAIL_DELIVERY_MODE:'outbox',DEPLOYMENT_STAGE:'staging',DATABASE_URL:'postgresql://fake:fake@localhost/lafix_staging'}),false);
 assert.equal(mailConfigured({AUTH_ENCRYPTION_KEY:key,MAIL_DELIVERY_MODE:'outbox',DEPLOYMENT_STAGE:'test',DATABASE_URL:'postgresql://fake:fake@localhost/lafix_test'}),true);
});
test('durable email delivery uses idempotency, erases delivered payload and keeps failures for retry',async()=>{
 const names=['AUTH_ENCRYPTION_KEY','MAIL_DELIVERY_MODE','RESEND_API_KEY','MAIL_FROM','APP_ORIGIN'];const previous=Object.fromEntries(names.map(k=>[k,process.env[k]])),oldFetch=globalThis.fetch;
 Object.assign(process.env,{AUTH_ENCRYPTION_KEY:randomBytes(32).toString('base64'),MAIL_DELIVERY_MODE:'resend',RESEND_API_KEY:'synthetic-key',MAIL_FROM:'LaFix <synthetic@example.invalid>',APP_ORIGIN:'https://example.invalid'});
 try{
  for(const success of [true,false]){
   const updates=[],item={id:'synthetic-outbox-id',attempts:0,payload:seal(JSON.stringify({to:'recipient@example.invalid',subject:'Synthetic test',text:'No real mail sent.'}),'mail')};let fetched=false;
   const db={emailOutbox:{findMany:async()=>fetched?[]:[item],updateMany:async()=>({count:1}),update:async x=>{updates.push(x);fetched=true}}};
   globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');assert.equal(options.headers['Idempotency-Key'],'lafix-mail-synthetic-outbox-id');assert.deepEqual(JSON.parse(options.body).to,['recipient@example.invalid']);return {ok:success,status:429}};
   const result=await deliverOutbox(db);assert.equal(result.sent,success?1:0);
   if(success){assert.equal(updates[0].data.payload,'');assert.ok(updates[0].data.sentAt)}else{assert.equal(updates[0].data.lastError,'PROVIDER_429');assert.ok(updates[0].data.nextAttemptAt>Date.now());assert.equal(updates[0].data.payload,undefined)}
  }
 }finally{globalThis.fetch=oldFetch;for(const [name,value] of Object.entries(previous)){if(value===undefined)delete process.env[name];else process.env[name]=value}}
});
