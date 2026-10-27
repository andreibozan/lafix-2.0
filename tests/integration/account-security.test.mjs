import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';
import {actionTokenForTest} from '../helpers/accounts.mjs';
import {totp} from '../../apps/web/lib/account-crypto.mjs';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
test('email verification, single-use reset, revoked sessions and mandatory administrator MFA',async()=>{
 assert.match(process.env.DATABASE_URL||'',/\/lafix_test(?:\?|$)/);
 const db=new PrismaClient(),suffix=randomUUID(),email=`security-${suffix}@example.invalid`,adminEmail=`security-admin-${suffix}@example.invalid`,password='Synthetic-test-password-123!',nextPassword='Synthetic-new-password-456!',ids=[];const outbox=[];
 const post=(path,data,token)=>fetch(base+path,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});
 try{
  const signup=await post('/api/auth/register',{email,password,name:'Test securitate',role:'CLIENT'});assert.equal(signup.status,201);const body=await signup.json();assert.equal(body.verificationRequired,true);assert.equal(body.token,undefined);const user=await db.user.findUniqueOrThrow({where:{email}});ids.push(user.id);
  assert.equal((await post('/api/auth/login',{email,password})).status,403);
  const verify=await actionTokenForTest(db,email);outbox.push(verify.outboxId);assert.equal((await post('/api/auth/email/verify',{token:verify.token})).status,200);assert.equal((await post('/api/auth/email/verify',{token:verify.token})).status,400);
  const logged=await(await post('/api/auth/login',{email,password})).json();assert.ok(logged.token);
  const existing=await post('/api/auth/password/request',{email}),missing=await post('/api/auth/password/request',{email:`missing-${suffix}@example.invalid`});assert.equal(existing.status,200);assert.equal(missing.status,200);assert.deepEqual(await existing.json(),await missing.json());
  const reset=await actionTokenForTest(db,email);outbox.push(reset.outboxId);assert.equal((await post('/api/auth/password/reset',{token:reset.token,password:nextPassword})).status,200);assert.equal((await post('/api/auth/password/reset',{token:reset.token,password:nextPassword})).status,400);assert.equal((await fetch(base+'/api/auth/me',{headers:{authorization:`Bearer ${logged.token}`}})).status,401);assert.equal((await post('/api/auth/login',{email,password})).status,401);assert.ok((await(await post('/api/auth/login',{email,password:nextPassword})).json()).token);
  await post('/api/auth/password/request',{email});const expired=await actionTokenForTest(db,email);outbox.push(expired.outboxId);await db.accountActionToken.updateMany({where:{userId:user.id,kind:'RESET_PASSWORD',usedAt:null},data:{expiresAt:new Date(Date.now()-1000)}});assert.equal((await post('/api/auth/password/reset',{token:expired.token,password:'Synthetic-expired-password-123!'})).status,400);
  const admin=await db.user.create({data:{email:adminEmail,name:'Admin MFA sintetic',role:'ADMIN',passwordHash:await bcrypt.hash(password,12),emailVerifiedAt:new Date()}});ids.push(admin.id);
  const limited=await(await post('/api/auth/login',{email:adminEmail,password})).json();assert.equal(limited.setupRequired,true);assert.equal((await fetch(base+'/api/admin/overview',{headers:{authorization:`Bearer ${limited.token}`}})).status,401);
  const begin=await post('/api/auth/mfa',{action:'BEGIN',password},limited.token);assert.equal(begin.status,200);const setup=await begin.json();assert.ok(setup.secret);
  const enable=await post('/api/auth/mfa',{action:'ENABLE',password,code:totp(setup.secret)},limited.token);assert.equal(enable.status,200);const enabled=await enable.json();assert.equal(enabled.codes.length,10);assert.equal((await fetch(base+'/api/admin/overview',{headers:{authorization:`Bearer ${enabled.token}`}})).status,200);assert.equal((await fetch(base+'/api/auth/me',{headers:{authorization:`Bearer ${limited.token}`}})).status,401);
  const challenge=await(await post('/api/auth/login',{email:adminEmail,password})).json();assert.equal(challenge.mfaRequired,true);assert.equal(challenge.token,undefined);
  const recovery=await post('/api/auth/login',{email:adminEmail,password,otp:enabled.codes[0]});assert.equal(recovery.status,200);assert.equal((await post('/api/auth/login',{email:adminEmail,password,otp:enabled.codes[0]})).status,401);
  assert.equal((await post('/api/auth/mfa',{action:'DISABLE',password,code:enabled.codes[1]},enabled.token)).status,403);
  await post('/api/auth/password/request',{email:adminEmail});const adminReset=await actionTokenForTest(db,adminEmail);outbox.push(adminReset.outboxId);assert.equal((await post('/api/auth/password/reset',{token:adminReset.token,password:nextPassword})).status,200);assert.equal((await(await post('/api/auth/login',{email:adminEmail,password:nextPassword})).json()).mfaRequired,true);
 }finally{await db.emailOutbox.deleteMany({where:{id:{in:outbox}}});await db.auditEvent.deleteMany({where:{actorId:{in:ids}}});await db.user.deleteMany({where:{id:{in:ids}}});await db.$disconnect()}
});
