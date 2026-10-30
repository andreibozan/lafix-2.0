import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
import {verifiedAccount} from '../helpers/accounts.mjs';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
test('only owning client completes an accepted project and reviews once; moderation is admin-only',async()=>{
 assert.match(process.env.DATABASE_URL||'',/\/lafix_test(?:\?|$)/);
 const db=new PrismaClient(),ids=[],requests=[];let provider;
 const post=(path,data,token)=>fetch(base+path,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});
 try{
 const suffix=randomUUID();
 const client=await verifiedAccount(base,db,{email:`experience-${suffix}@example.invalid`,name:'Client sintetic',role:'CLIENT',password:'Synthetic-test-password-123!'});ids.push(client.user.id);
 const other=await verifiedAccount(base,db,{email:`other-${suffix}@example.invalid`,name:'Alt client sintetic',role:'CLIENT',password:'Synthetic-test-password-123!'});ids.push(other.user.id);
 const pu=await db.user.create({data:{email:`provider-${suffix}@example.invalid`,name:'Prestator sintetic',role:'PROVIDER',passwordHash:'not-a-real-password'}});ids.push(pu.id);
 provider=await db.providerProfile.create({data:{userId:pu.id,businessName:'Atelier sintetic',phone:'0000000000',categories:['Renovări'],counties:['Hunedoara'],status:'APPROVED'}});
 const project=await db.serviceRequest.create({data:{clientId:client.user.id,contactName:'Client sintetic',contactEmail:`experience-${suffix}@example.invalid`,contactPhone:'0000000000',category:'Renovări',county:'Hunedoara',locality:'Deva',description:'Lucrare sintetică pentru testarea finalizării.',status:'ACCEPTED'}});requests.push(project.id);
 await db.offer.create({data:{requestId:project.id,providerId:provider.id,amount:100,message:'Ofertă sintetică pentru test',status:'ACCEPTED'}});
 const path=`/api/client/requests/${project.id}/progress`;
 assert.equal((await post(path,{action:'COMPLETE'})).status,403);
 assert.equal((await post(path,{action:'COMPLETE'},other.token)).status,409);
 assert.equal((await post(path,{action:'REVIEW',rating:5,text:'Experiență sintetică pozitivă.'},client.token)).status,409);
 assert.equal((await post(path,{action:'COMPLETE'},client.token)).status,200);
 assert.equal((await post(path,{action:'COMPLETE'},client.token)).status,409);
 assert.equal((await post(path,{action:'REVIEW',rating:6,text:'Experiență sintetică pozitivă.'},client.token)).status,400);
 assert.equal((await post(path,{action:'REVIEW',rating:5,text:'Experiență sintetică pozitivă.'},client.token)).status,200);
 assert.equal((await post(path,{action:'REVIEW',rating:1,text:'Nu poate înlocui recenzia.'},client.token)).status,409);
 const stored=await db.serviceRequest.findUniqueOrThrow({where:{id:project.id}});assert.equal(stored.reviewPublished,false);assert.ok(stored.completedAt);
 assert.equal((await post('/api/admin/interventions',{id:project.id,publishReview:true},client.token)).status,403);
 assert.equal((await fetch(base+'/api/admin/metrics',{headers:{authorization:`Bearer ${client.token}`}})).status,403);
 }finally{
 await db.auditEvent.deleteMany({where:{resourceId:{in:requests}}});await db.offer.deleteMany({where:{requestId:{in:requests}}});await db.serviceRequest.deleteMany({where:{id:{in:requests}}});if(provider)await db.providerProfile.delete({where:{id:provider.id}});await db.auditEvent.deleteMany({where:{actorId:{in:ids}}});await db.user.deleteMany({where:{id:{in:ids}}});await db.$disconnect();
 }
});
