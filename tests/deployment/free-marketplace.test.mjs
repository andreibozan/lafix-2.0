import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {createServer} from 'node:net';
import {resolve} from 'node:path';
import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';

test('free launch: approval, max-three assignment, contact, offers and acceptance need no credit', {skip:!process.env.DATABASE_URL}, async()=>{
 assert.match(process.env.DATABASE_URL,/lafix_test(?:\?|$)/);
 const probe=createServer().listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
 const base=`http://127.0.0.1:${port}`,db=new PrismaClient(),suffix=randomUUID(),password='Synthetic-test-password-123!',users=[];let requestId;
 const child=spawn(process.execPath,[resolve('node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:resolve('apps/web'),env:{...process.env,DEPLOYMENT_STAGE:'test',MARKETPLACE_MODE:'free',BILLING_MODE:'disabled',APP_ORIGIN:base,ALLOW_LOCAL_HTTP_AUTH:'true'},stdio:'ignore'});
 const call=(path,token,body,method=body?'POST':'GET')=>fetch(base+path,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
 try{
  let ready=false;for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error('Server stopped');try{const r=await fetch(base+'/api/health');if(r.ok){ready=true;break}}catch{}await delay(100)}assert.ok(ready);
  const admin=await db.user.create({data:{email:`admin-${suffix}@example.invalid`,name:'Admin sintetic',role:'ADMIN',passwordHash:await bcrypt.hash(password,12)}});users.push(admin.id);
  const a=await(await call('/api/auth/login',null,{email:admin.email,password})).json();
  async function register(role,i){const r=await call('/api/auth/register',null,{role,email:`free-${suffix}-${i}@example.invalid`,name:'Test sintetic',password,...(role==='PROVIDER'?{businessName:`Firma ${i}`,phone:'0700000000',categories:['Renovări'],counties:['Hunedoara']}:{})});assert.equal(r.status,201);const j=await r.json();users.push(j.user.id);return j}
  const client=await register('CLIENT','client'),providers=[];
  for(let i=0;i<4;i++){const p=await register('PROVIDER',i);const profile=await db.providerProfile.findUniqueOrThrow({where:{userId:p.user.id}});p.profile=profile;assert.equal((await call(`/api/admin/providers/${profile.id}`,a.token,{status:'APPROVED'},'PATCH')).status,200);providers.push(p)}
  const created=await call('/api/requests',client.token,{contactName:'Client sintetic',contactEmail:'synthetic@example.invalid',contactPhone:'0700000000',category:'Renovări',county:'Hunedoara',locality:'Deva',description:'Solicitare sintetică pentru lansarea gratuită.'});assert.equal(created.status,201);requestId=(await created.json()).id;
  assert.equal((await call(`/api/admin/requests/${requestId}/qualify`,a.token,{decision:'QUALIFIED',contactConfirmed:true,intentConfirmed:true,detailsComplete:true,note:'Confirmare sintetică pentru testarea gratuită'})).status,200);
  for(const r of await Promise.all(Array.from({length:5},()=>call('/api/admin/match',a.token,{requestId}))))assert.equal(r.status,200);
  const matches=await db.requestMatch.findMany({where:{requestId}});assert.equal(matches.length,3);
  const eligible=providers.filter(p=>matches.some(m=>m.providerId===p.profile.id));const outsider=providers.find(p=>!eligible.includes(p));
  assert.equal((await call('/api/offers',outsider.token,{requestId,amount:500,message:'Ofertă de test nealocată'})).status,403);
  const leadData=await(await call('/api/provider/leads',eligible[0].token)).json();const lead=leadData.leads.find(x=>x.id===requestId);assert.equal(lead.unlocked,true);assert.equal(lead.priceBani,0);assert.equal(lead.contact.email,'synthetic@example.invalid');
  const billing=await(await call('/api/provider/billing',eligible[0].token)).json();assert.equal(billing.monetizationEnabled,false);assert.equal(billing.sandbox,false);
  assert.equal((await call('/api/provider/billing/demo',eligible[0].token,{action:'TOPUP',idempotencyKey:randomUUID()})).status,503);
  const offer=await call('/api/offers',eligible[0].token,{requestId,amount:500,message:'Ofertă sintetică fără taxe de platformă'});assert.equal(offer.status,201);const o=(await offer.json()).offer;
  assert.equal((await call(`/api/offers/${o.id}/accept`,client.token,{})).status,200);
  assert.equal(await db.billingTransaction.count({where:{providerId:{in:providers.map(p=>p.profile.id)}}}),0);
  assert.ok((await db.providerProfile.findMany({where:{id:{in:providers.map(p=>p.profile.id)}}})).every(p=>p.creditBalance===0));
  const landing=await(await fetch(base+'/prestatori')).text();assert.match(landing,/LANSARE GRATUITĂ/);assert.doesNotMatch(landing,/129,00|20,00|Simulează deblocarea/);
 }finally{
  if(child.exitCode===null){child.kill('SIGTERM');await once(child,'exit')}
  if(requestId){await db.offer.deleteMany({where:{requestId}});await db.requestMatch.deleteMany({where:{requestId}});await db.serviceRequest.deleteMany({where:{id:requestId}})}
  await db.auditEvent.deleteMany({where:{actorId:{in:users}}});await db.providerProfile.deleteMany({where:{userId:{in:users}}});await db.user.deleteMany({where:{id:{in:users}}});await db.$disconnect();
 }
});
