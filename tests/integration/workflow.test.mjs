import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';
const {hash} = bcrypt;
import {randomUUID} from 'node:crypto';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
const password='Synthetic-test-password-123!';
test('real PostgreSQL: roles, concurrent matching, offers, ownership, acceptance and session revocation',async()=>{
 assert.match(process.env.DATABASE_URL||'',/lafix_test(?:\?|$)/,'Requires dedicated lafix_test database');
 const db=new PrismaClient();const suffix=randomUUID();const users=[];let requestId;
 async function call(path,token,body,method=body?'POST':'GET'){
  return fetch(base+path,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
 }
 async function account(role,i){const r=await call('/api/auth/register',null,{role,name:'Test sintetic',email:`test-${suffix}-${i}@example.invalid`,password,...(role==='PROVIDER'?{businessName:`Test ${i}`,phone:'0700000000',categories:['Renovări'],counties:['Hunedoara']}:{})});const j=await r.json();assert.equal(r.status,201,JSON.stringify(j));users.push(j.user.id);return j;}
 try{
 const admin=await db.user.create({data:{email:`admin-${suffix}@example.invalid`,name:'Test admin',role:'ADMIN',passwordHash:await hash(password,12)}});users.push(admin.id);
 const login=await call('/api/auth/login',null,{email:admin.email,password});assert.equal(login.status,200);const a=(await login.json()).token;
 const client=await account('CLIENT','client'),stranger=await account('CLIENT','stranger');
 assert.equal((await call('/api/auth/login',null,{email:client.user.email,password,expectedRole:'ADMIN'})).status,401);
 const clientLogin=await call('/api/auth/login',null,{email:client.user.email,password,next:'/admin'});assert.equal(clientLogin.status,200);assert.equal((await clientLogin.json()).redirectTo,'/dashboard');
 const providers=[];for(let i=0;i<5;i++)providers.push(await account('PROVIDER',i));
 assert.equal((await call('/api/admin/overview',client.token)).status,403);
 assert.equal((await call('/api/provider/leads',providers[0].token)).status,403);
 for(const p of providers){const profile=await db.providerProfile.findUnique({where:{userId:p.user.id}});assert.equal((await call(`/api/admin/providers/${profile.id}`,a,{status:'APPROVED'},'PATCH')).status,200);p.profile=profile;}
 const r=await call('/api/requests',client.token,{contactName:'Test sintetic',contactEmail:'synthetic@example.invalid',contactPhone:'0700000000',category:'Renovări',county:'Hunedoara',locality:'Deva',description:'Solicitare sintetică pentru verificare.'});assert.equal(r.status,201);requestId=(await r.json()).id;
 assert.equal((await call('/api/admin/match',a,{requestId})).status,400);
 assert.equal((await call(`/api/admin/requests/${requestId}/qualify`,client.token,{decision:'QUALIFIED',contactConfirmed:true,intentConfirmed:true,detailsComplete:true,note:'Confirmare sintetică pentru test'})).status,403);
 assert.equal((await call(`/api/admin/requests/${requestId}/qualify`,a,{decision:'QUALIFIED',contactConfirmed:true,intentConfirmed:true,detailsComplete:true,note:'Confirmare sintetică pentru test'})).status,200);
 const matches=await Promise.all(Array.from({length:8},()=>call('/api/admin/match',a,{requestId})));for(const r of matches)assert.equal(r.status,200);
 const assigned=await db.requestMatch.findMany({where:{requestId}});assert.equal(assigned.length,3);
 const eligible=providers.filter(p=>assigned.some(m=>m.providerId===p.profile.id));
 const outsider=providers.find(p=>!eligible.includes(p));assert.equal((await call('/api/offers',outsider.token,{requestId,amount:100,message:'Ofertă sintetică de test'})).status,403);
 const locked=await call('/api/provider/leads',eligible[0].token);const lockedJson=await locked.json();const preview=lockedJson.leads.find(l=>l.id===requestId);assert.equal(preview.unlocked,false);assert.equal(preview.contact,undefined);assert.ok(!JSON.stringify(preview).includes('synthetic@example.invalid'));
 assert.equal((await call('/api/offers',eligible[0].token,{requestId,amount:100,message:'Ofertă înainte de deblocare'})).status,403);
 assert.equal((await call(`/api/provider/leads/${requestId}/unlock`,outsider.token,{})).status,404);
 assert.equal((await call(`/api/provider/leads/${requestId}/unlock`,eligible[0].token,{})).status,402);
 assert.equal((await db.requestMatch.findUnique({where:{requestId_providerId:{requestId,providerId:eligible[0].profile.id}}})).unlockedAt,null);
 for(const p of eligible){
  const key=randomUUID();const credits=await Promise.all(Array.from({length:4},()=>call('/api/provider/billing/demo',p.token,{action:'TOPUP',idempotencyKey:key})));for(const r of credits)assert.equal(r.status,200);
  assert.equal((await db.providerProfile.findUnique({where:{id:p.profile.id}})).creditBalance,20000);
  const unlocks=await Promise.all(Array.from({length:6},()=>call(`/api/provider/leads/${requestId}/unlock`,p.token,{})));for(const r of unlocks)assert.equal(r.status,200);
  assert.equal((await db.providerProfile.findUnique({where:{id:p.profile.id}})).creditBalance,18000);
 }
 const paid=await (await call('/api/provider/leads',eligible[0].token)).json();assert.equal(paid.leads.find(l=>l.id===requestId).contact.email,'synthetic@example.invalid');
 assert.equal((await call('/api/provider/templates',eligible[0].token)).status,403);
 const proKey=randomUUID();const proResults=await Promise.all(Array.from({length:4},()=>call('/api/provider/billing/demo',eligible[0].token,{action:'PRO',idempotencyKey:proKey})));for(const r of proResults)assert.equal(r.status,200);
 assert.equal((await db.providerProfile.findUnique({where:{id:eligible[0].profile.id}})).creditBalance,5100);
 assert.equal((await call('/api/provider/templates',eligible[0].token,{title:'Test sintetic',message:'Mesaj demonstrativ reutilizabil'})).status,201);
 assert.equal((await call('/api/provider/billing',eligible[0].token,{},'PATCH')).status,200);
 const offers=[];for(const p of eligible){const r=await call('/api/offers',p.token,{requestId,amount:100,message:'Ofertă sintetică de test'});assert.equal(r.status,201);offers.push((await r.json()).offer);}
 assert.equal((await call('/api/offers',eligible[0].token,{requestId,amount:100,message:'Ofertă sintetică de test'})).status,409);
 assert.equal((await call(`/api/provider/leads/${requestId}/report`,eligible[2].token,{reason:'INVALID_CONTACT',note:'Contact sintetic invalid raportat pentru analiză'})).status,200);
 assert.equal((await call(`/api/provider/leads/${requestId}/report`,eligible[2].token,{reason:'INVALID_CONTACT',note:'Aceeași sesizare nu trebuie duplicată'})).status,200);
 const refunded=assigned.find(m=>m.providerId===eligible[2].profile.id);
 assert.equal(await db.auditEvent.count({where:{action:'LEAD_REPORTED',resourceId:refunded.id}}),1);
 const refunds=await Promise.all(Array.from({length:4},()=>call(`/api/admin/matches/${refunded.id}/refund`,a,{reason:'INVALID_CONTACT',note:'Contact sintetic invalid, verificat de administrator'})));for(const r of refunds)assert.equal(r.status,200);
 assert.equal((await db.providerProfile.findUnique({where:{id:eligible[2].profile.id}})).creditBalance,20000);
 assert.equal((await call(`/api/provider/leads/${requestId}/unlock`,eligible[2].token,{})).status,409);
 const removed=await (await call('/api/provider/leads',eligible[2].token)).json();assert.equal(removed.leads.find(l=>l.id===requestId).contact,undefined);

 assert.equal((await call(`/api/offers/${offers[0].id}/accept`,stranger.token,{})).status,409);
 const accepted=await Promise.all(offers.map(o=>call(`/api/offers/${o.id}/accept`,client.token,{})));assert.equal(accepted.filter(r=>r.status===200).length,1);
 assert.equal(await db.offer.count({where:{requestId,status:'ACCEPTED'}}),1);assert.equal(await db.offer.count({where:{requestId,status:'REJECTED'}}),2);
 assert.equal((await db.serviceRequest.findUnique({where:{id:requestId}})).status,'ACCEPTED');
 const csrf=await fetch(base+'/api/auth/logout',{method:'POST',headers:{origin:'https://evil.invalid',cookie:`lafix_session=${client.token}`}});assert.equal(csrf.status,403);
 const overview=await call('/api/admin/overview?view=transactions&status=LEAD_UNLOCK',a);assert.equal(overview.status,200);const metrics=await overview.json();assert.ok(metrics.rows.every(r=>r.kind==='LEAD_UNLOCK'));assert.ok(metrics.summary.topupsBani>metrics.summary.netRevenueBani);
 const report=await db.leadReport.findUnique({where:{matchId:refunded.id}});assert.equal(report.status,'RESOLVED');
 assert.equal((await call('/api/auth/logout',client.token,{})).status,200);assert.equal((await call('/api/auth/me',client.token)).status,401);
 }finally{
 if(requestId){await db.offer.deleteMany({where:{requestId}});await db.requestMatch.deleteMany({where:{requestId}});await db.serviceRequest.deleteMany({where:{id:requestId}});}
 await db.auditEvent.deleteMany({where:{actorId:{in:users}}});
 await db.providerProfile.deleteMany({where:{userId:{in:users}}});await db.user.deleteMany({where:{id:{in:users}}});await db.$disconnect();
 }
});
