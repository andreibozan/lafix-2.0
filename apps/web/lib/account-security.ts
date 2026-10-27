import {Prisma} from '@prisma/client';
import {db} from './db';
import {newToken,tokenHash,seal,unseal,verifyTotp} from './account-crypto.mjs';
import {createHmac} from 'node:crypto';
import {withTransactionRetry} from './transaction-retry.mjs';
export class SecurityError extends Error {constructor(message:string,public status=400){super(message)}}
export async function securityLimit(subject:string,maximum=5,windowMs=15*60_000){
 const id=createHmac('sha256',process.env.AUTH_SECRET!).update(`security:${subject}`).digest('hex'),now=new Date(),end=new Date(Date.now()+windowMs);
 const rows=await db.$queryRaw<{attempts:number,resetAt:Date}[]>`INSERT INTO "AuthAttemptBucket" (id,attempts,"resetAt") VALUES (${id},1,${end}) ON CONFLICT (id) DO UPDATE SET attempts=CASE WHEN "AuthAttemptBucket"."resetAt"<=${now} THEN 1 ELSE LEAST("AuthAttemptBucket".attempts+1,${maximum+1}) END,"resetAt"=CASE WHEN "AuthAttemptBucket"."resetAt"<=${now} THEN ${end} ELSE "AuthAttemptBucket"."resetAt" END RETURNING attempts,"resetAt"`;
 if(rows[0].attempts>maximum)throw new SecurityError('Prea multe încercări. Revino mai târziu.',429);
}
export async function createAccountAction(tx:Prisma.TransactionClient,user:{id:string,email:string},kind:'VERIFY_EMAIL'|'RESET_PASSWORD'){
 const raw=newToken(),expiresAt=new Date(Date.now()+(kind==='VERIFY_EMAIL'?24*3600_000:30*60_000));
 await tx.accountActionToken.updateMany({where:{userId:user.id,kind,usedAt:null},data:{usedAt:new Date()}});
 await tx.accountActionToken.create({data:{userId:user.id,kind,tokenHash:tokenHash(raw),expiresAt}});
 const path=kind==='VERIFY_EMAIL'?'/account/verify':'/account/reset';
 const link=`${new URL(process.env.APP_ORIGIN!).origin}${path}#token=${raw}`;
 const subject=kind==='VERIFY_EMAIL'?'Confirmă adresa de email LaFix':'Recuperarea parolei LaFix';
 const text=kind==='VERIFY_EMAIL'?`Confirmă adresa de email apăsând butonul din pagina de mai jos. Linkul expiră în 24 de ore.\n\n${link}\n\nDacă nu ai creat acest cont, ignoră mesajul.`:`Ai cerut o parolă nouă pentru LaFix. Linkul expiră în 30 de minute.\n\n${link}\n\nDacă nu ai cerut recuperarea parolei, ignoră mesajul. Parola actuală rămâne valabilă.`;
 await tx.emailOutbox.create({data:{payload:seal(JSON.stringify({to:user.email,subject,text}),'mail'),expiresAt}});
}
export async function consumeAction(raw:string,kind:string,change:(tx:Prisma.TransactionClient,userId:string)=>Promise<void>){
 const initial=await db.accountActionToken.findUnique({where:{tokenHash:tokenHash(raw)}});if(!initial||initial.kind!==kind)throw new SecurityError('Link invalid sau expirat.');
 return withTransactionRetry(()=>db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "User" WHERE id=${initial.userId} FOR UPDATE`;
  const token=await tx.accountActionToken.findUnique({where:{id:initial.id}});
  if(!token||token.usedAt||token.expiresAt<=new Date())throw new SecurityError('Link invalid sau expirat.');
  await change(tx,token.userId);
  if(kind==='VERIFY_EMAIL'){const user=await tx.user.findUniqueOrThrow({where:{id:token.userId}});if(user.role==='CLIENT')await tx.serviceRequest.updateMany({where:{clientId:null,requestSource:'POPUP',contactEmail:{equals:user.email,mode:'insensitive'}},data:{clientId:user.id}})}
  await tx.accountActionToken.updateMany({where:{userId:token.userId,kind,usedAt:null},data:{usedAt:new Date()}});
  await tx.auditEvent.create({data:{actorId:token.userId,resourceId:token.userId,action:kind==='VERIFY_EMAIL'?'EMAIL_VERIFIED':'PASSWORD_RESET'}});
 }));
}
export async function consumeMfa(tx:Prisma.TransactionClient,user: {id:string,mfaSecret:string|null,mfaLastCounter:bigint|null,mfaRecoveryHashes:string[]},code:string){
 if(!user.mfaSecret)return false;
 const counter=verifyTotp(unseal(user.mfaSecret,'mfa'),code,user.mfaLastCounter);
 if(counter!==null){await tx.user.update({where:{id:user.id},data:{mfaLastCounter:counter}});return true}
 const hashed=tokenHash(code.trim().toLowerCase()),index=user.mfaRecoveryHashes.indexOf(hashed);
 if(index<0)return false;
 await tx.user.update({where:{id:user.id},data:{mfaRecoveryHashes:user.mfaRecoveryHashes.filter((_,i)=>i!==index)}});return true;
}
