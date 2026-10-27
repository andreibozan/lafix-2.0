import {randomUUID} from 'node:crypto';
import {unseal,encryptionReady} from './account-crypto.mjs';
export function mailConfigured(env=process.env){
 const test=env.MAIL_DELIVERY_MODE==='outbox'&&env.DEPLOYMENT_STAGE==='test'&&/\/lafix_test(?:\?|$)/.test(env.DATABASE_URL||'');
 return encryptionReady(env)&&(test||!!(env.RESEND_API_KEY&&env.MAIL_FROM&&/^https:\/\//.test(env.APP_ORIGIN||'')));
}
export async function deliverOutbox(db,limit=5){
 if(!mailConfigured()||process.env.MAIL_DELIVERY_MODE==='outbox')return {sent:0};
 let sent=0;
 for(let i=0;i<limit;i++){
  const now=new Date(),lease=new Date(now.getTime()+60_000);
  const candidates=await db.emailOutbox.findMany({where:{sentAt:null,expiresAt:{gt:now},attempts:{lt:10},nextAttemptAt:{lte:now},OR:[{leaseUntil:null},{leaseUntil:{lt:now}}]},orderBy:{createdAt:'asc'},take:1});
  const item=candidates[0];if(!item)break;
  const claim=await db.emailOutbox.updateMany({where:{id:item.id,sentAt:null,OR:[{leaseUntil:null},{leaseUntil:{lt:now}}]},data:{leaseUntil:lease,attempts:{increment:1}}});if(!claim.count)continue;
  try{
   const payload=JSON.parse(unseal(item.payload,'mail'));
   const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`lafix-mail-${item.id}`},body:JSON.stringify({from:process.env.MAIL_FROM,to:[payload.to],subject:payload.subject,text:payload.text}),signal:AbortSignal.timeout(10_000)});
   if(!response.ok)throw Error(`PROVIDER_${response.status}`);
   await db.emailOutbox.update({where:{id:item.id},data:{sentAt:new Date(),leaseUntil:null,lastError:null,payload:''}});sent++;
  }catch(error){const message=/^PROVIDER_\d{3}$/.test(error?.message||'')?error.message:'DELIVERY_UNAVAILABLE';await db.emailOutbox.update({where:{id:item.id},data:{leaseUntil:null,lastError:message,nextAttemptAt:new Date(Date.now()+Math.min(3600_000,60_000*2**item.attempts))}})}
 }
 return {sent};
}
