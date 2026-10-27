import {NextResponse} from 'next/server';
import {compare,hashSync} from 'bcryptjs';
import {z} from 'zod';
import {db} from '../../../../lib/db';
import {verifyWriteOrigin,issueToken,setSession,revokeSession} from '../../../../lib/auth';
import {authConfigured,loginDestination} from '../../../../lib/auth-policy.mjs';
import {consumeLoginAttempt} from '../../../../lib/login-rate-limit';
import {consumeMfa,SecurityError} from '../../../../lib/account-security';
import {withTransactionRetry} from '../../../../lib/transaction-retry.mjs';
const schema=z.object({email:z.email().max(200),password:z.string().min(1).max(128).refine(v=>new TextEncoder().encode(v).length<=72),otp:z.string().max(40).optional(),expectedRole:z.literal('ADMIN').optional(),next:z.string().max(100).optional()});
const dummyHash=hashSync('lafix-nonexistent-account-placeholder',12);
export async function POST(req:Request){
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});
 const p=schema.safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({error:'Date invalide'},{status:400});
 if(!authConfigured())return NextResponse.json({error:'Autentificarea nu este încă disponibilă.'},{status:503});
 try{
  const email=p.data.email.toLowerCase(),limit=await consumeLoginAttempt(email);
  if(!limit.allowed)return NextResponse.json({error:'Prea multe încercări. Încearcă din nou mai târziu.'},{status:429,headers:{'Retry-After':String(limit.retryAfter)}});
  const user=await db.user.findUnique({where:{email}}),valid=await compare(p.data.password,user?.passwordHash||dummyHash);
  if(!user||!valid||(p.data.expectedRole&&user.role!=='ADMIN'))return NextResponse.json({error:'Email sau parolă incorecte'},{status:401});
  if(!user.emailVerifiedAt)return NextResponse.json({error:'Confirmă adresa de email înainte de autentificare.',verificationRequired:true},{status:403});
  if(user.mfaSecret&&!p.data.otp)return NextResponse.json({mfaRequired:true},{headers:{'Cache-Control':'no-store'}});
  const result=await withTransactionRetry(()=>db.$transaction(async tx=>{
   await tx.$queryRaw`SELECT id FROM "User" WHERE id=${user.id} FOR UPDATE`;
   const current=await tx.user.findUniqueOrThrow({where:{id:user.id}});
   if(current.passwordHash!==user.passwordHash||!current.emailVerifiedAt)throw new SecurityError('Reîncearcă autentificarea.',401);
   const mfaVerified=current.mfaSecret?await consumeMfa(tx,current,p.data.otp||''):false;
   if(current.mfaSecret&&!mfaVerified)throw new SecurityError('Cod de autentificare invalid sau deja folosit.',401);
   await tx.authAttemptBucket.deleteMany({where:{id:limit.id}});
   if(current.role==='CLIENT')await tx.serviceRequest.updateMany({where:{clientId:null,requestSource:'POPUP',contactEmail:{equals:current.email,mode:'insensitive'}},data:{clientId:current.id}});
   const token=await issueToken(current.id,current.role,tx,mfaVerified);
   await tx.auditEvent.create({data:{actorId:current.id,action:'AUTH_LOGIN',resourceId:current.id}});
   return {token,setupRequired:current.role==='ADMIN'&&!current.mfaEnabledAt};
  }));
  await revokeSession(req);await setSession(result.token,user.role);
  return NextResponse.json({user:{id:user.id,email:user.email,name:user.name,role:user.role},token:result.token,setupRequired:result.setupRequired,redirectTo:result.setupRequired?'/account/security':loginDestination(user.role,p.data.next)},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return NextResponse.json({error:e instanceof SecurityError?e.message:'Serviciul de autentificare este temporar indisponibil.'},{status:e instanceof SecurityError?e.status:503})}
}
