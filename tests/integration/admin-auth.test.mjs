import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PrismaClient} from '@prisma/client';
import {hash} from 'bcryptjs';
import {decodeJwt} from 'jose';
import {randomUUID,createHmac} from 'node:crypto';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
test('admin login requires database role, limits attempts and does not expose credentials',async()=>{
 assert.match(process.env.DATABASE_URL||'',/lafix_test(?:\?|$)/,'Requires dedicated synthetic test DB');
 const db=new PrismaClient(),suffix=randomUUID(),password='Synthetic-admin-password-123!',email=`admin-${suffix}@example.invalid`,unknown=`missing-${suffix}@example.invalid`;
 let id;
 const post=(path,data)=>fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
 try{
 const u=await db.user.create({data:{email,name:'Admin sintetic',passwordHash:await hash(password,12),role:'ADMIN'}});id=u.id;
 const denied=await post('/api/auth/register',{email:`public-${suffix}@example.invalid`,password,name:'Test',role:'ADMIN'});assert.equal(denied.status,400);
 const unauthenticated=await fetch(base+'/admin',{redirect:'manual'});assert.ok([307,308].includes(unauthenticated.status));assert.match(unauthenticated.headers.get('location'),/admin\/login/);
 const r=await post('/api/auth/login',{email,password,expectedRole:'ADMIN'});assert.equal(r.status,200);const data=await r.json();assert.equal(data.redirectTo,'/admin');
 const jwt=decodeJwt(data.token);assert.equal(jwt.iss,'lafix');assert.equal(jwt.aud,'lafix-app');assert.equal(jwt.exp-jwt.iat,7200);
 const cookie=r.headers.get('set-cookie');assert.match(cookie,/HttpOnly/i);assert.match(cookie,/SameSite=Lax/i);assert.match(cookie,/Max-Age=7200/i);
 const rows=await fetch(base+'/api/admin/overview?view=customers',{headers:{authorization:`Bearer ${data.token}`}});assert.equal(rows.status,200);assert.doesNotMatch(await rows.text(),/passwordHash|lafix_session|AUTH_SECRET/);
 for(let attempt=0;attempt<10;attempt++)assert.equal((await post('/api/auth/login',{email:unknown,password:'wrong-password'})).status,401);
 const blocked=await post('/api/auth/login',{email:unknown,password:'wrong-password'});assert.equal(blocked.status,429);assert.ok(Number(blocked.headers.get('retry-after'))>0);
 const out=await fetch(base+'/api/auth/logout',{method:'POST',headers:{authorization:`Bearer ${data.token}`,'content-type':'application/json'},body:'{}'});assert.equal(out.status,200);
 assert.equal((await fetch(base+'/api/admin/overview',{headers:{authorization:`Bearer ${data.token}`}})).status,401);
 }finally{
 if(id){await db.auditEvent.deleteMany({where:{actorId:id}});await db.user.deleteMany({where:{id}})}
 if(process.env.AUTH_SECRET){const key=createHmac('sha256',process.env.AUTH_SECRET).update(unknown).digest('hex');await db.authAttemptBucket.deleteMany({where:{id:key}})}await db.$disconnect();
 }
});
