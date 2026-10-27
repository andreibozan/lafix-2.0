import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
import {verifiedAccount} from '../helpers/accounts.mjs';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
test('only popup intake permits anonymous requests; consent, cookie binding, replay and verified ownership are enforced',async()=>{
 assert.match(process.env.DATABASE_URL||'',/\/lafix_test(?:\?|$)/);const db=new PrismaClient(),email=`guest-${randomUUID()}@example.invalid`;let id,userId;
 const details={contactName:'Vizitator sintetic',contactEmail:email,contactPhone:'0700000000',category:'Renovări',county:'Hunedoara',locality:'Deva',description:'Solicitare sintetică fără autentificare din pop-up.'};
 const post=(path,data,headers={})=>fetch(base+path,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(data)});
 try{
  assert.equal((await post('/api/requests',details)).status,401);
  assert.notEqual((await post('/api/requests/popup',{...details,consent:true})).status,201);
  const ticket=await fetch(base+'/api/requests/popup');assert.equal(ticket.status,200);const proof=await ticket.json(),cookie=ticket.headers.get('set-cookie').split(';')[0],headers={cookie,origin:process.env.APP_ORIGIN};
  assert.equal((await post('/api/requests/popup',{...details,ticket:proof.ticket,consent:false},headers)).status,400);
  assert.equal((await post('/api/requests/popup',{...details,ticket:proof.ticket,consent:true})).status,403);
  const created=await post('/api/requests/popup',{...details,ticket:proof.ticket,consent:true},headers);assert.equal(created.status,201);id=(await created.json()).id;
  const stored=await db.serviceRequest.findUniqueOrThrow({where:{id}});assert.equal(stored.clientId,null);assert.equal(stored.requestSource,'POPUP');assert.ok(stored.consentAt);
  assert.equal((await post('/api/requests/popup',{...details,ticket:proof.ticket,consent:true},headers)).status,409);
  const account=await verifiedAccount(base,db,{role:'CLIENT',email,name:'Vizitator sintetic',password:'Synthetic-test-password-123!'});userId=account.user.id;
  assert.equal((await db.serviceRequest.findUniqueOrThrow({where:{id}})).clientId,userId);
 }finally{if(id){await db.auditEvent.deleteMany({where:{resourceId:id}});await db.serviceRequest.deleteMany({where:{id}})}if(userId){await db.auditEvent.deleteMany({where:{actorId:userId}});await db.user.delete({where:{id:userId}})}await db.$disconnect()}
});
