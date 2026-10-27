import {NextResponse} from 'next/server';
import {compare,hashSync} from 'bcryptjs';
import {z} from 'zod';
import {db} from '../../../../lib/db';
import {verifyWriteOrigin,issueToken,setSession,revokeSession} from '../../../../lib/auth';
import {authConfigured,loginDestination} from '../../../../lib/auth-policy.mjs';
import {consumeLoginAttempt} from '../../../../lib/login-rate-limit';
const schema=z.object({email:z.email().max(200),password:z.string().min(1).max(128).refine(v=>new TextEncoder().encode(v).length<=72),expectedRole:z.literal('ADMIN').optional(),next:z.string().max(100).optional()});
const dummyHash=hashSync('lafix-nonexistent-account-placeholder',12);
export async function POST(req:Request){
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});
 const p=schema.safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({error:'Date invalide'},{status:400});
 if(!authConfigured())return NextResponse.json({error:'Autentificarea nu este încă disponibilă. Baza de date și configurarea serverului trebuie conectate.'},{status:503});
 try{
  const email=p.data.email.toLowerCase(),limit=await consumeLoginAttempt(email);
  if(!limit.allowed)return NextResponse.json({error:'Prea multe încercări. Încearcă din nou mai târziu.'},{status:429,headers:{'Retry-After':String(limit.retryAfter)}});
  const user=await db.user.findUnique({where:{email}}),valid=await compare(p.data.password,user?.passwordHash||dummyHash);
  if(!user||!valid||(p.data.expectedRole&&user.role!=='ADMIN'))return NextResponse.json({error:'Email sau parolă incorecte'},{status:401});
  await revokeSession(req);
  const token=await db.$transaction(async tx=>{await tx.authAttemptBucket.deleteMany({where:{id:limit.id}});const signed=await issueToken(user.id,user.role,tx);await tx.auditEvent.create({data:{actorId:user.id,action:'AUTH_LOGIN',resourceId:user.id}});return signed});
  await setSession(token,user.role);
  return NextResponse.json({user:{id:user.id,email:user.email,name:user.name,role:user.role},token,redirectTo:loginDestination(user.role,p.data.next)},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Serviciul de autentificare este temporar indisponibil. Încearcă mai târziu.'},{status:503})}
}
