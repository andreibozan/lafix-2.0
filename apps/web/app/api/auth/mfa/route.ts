import {NextResponse} from 'next/server';
import {compare} from 'bcryptjs';
import {z} from 'zod';
import {db} from '../../../../lib/db';
import {authenticate,verifyWriteOrigin,issueToken,setSession} from '../../../../lib/auth';
import {newTotpSecret,seal,unseal,verifyTotp,recoveryCodes,tokenHash,encryptionReady} from '../../../../lib/account-crypto.mjs';
import {SecurityError,securityLimit,consumeMfa} from '../../../../lib/account-security';
import {withTransactionRetry} from '../../../../lib/transaction-retry.mjs';
const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer'};
export async function GET(req:Request){const s=await authenticate(req,{securitySetup:true});if(!s)return NextResponse.json({error:'Autentificare necesară.'},{status:401,headers});const user=await db.user.findUniqueOrThrow({where:{id:s.id},select:{email:true,role:true,mfaEnabledAt:true}});return NextResponse.json({email:user.email,role:user.role,enabled:!!user.mfaEnabledAt,required:user.role==='ADMIN',configured:encryptionReady()}, {headers})}
const schema=z.object({action:z.enum(['BEGIN','ENABLE','RECOVERY_CODES','DISABLE']),password:z.string().min(1).max(128),code:z.string().max(40).optional()});
export async function POST(req:Request){
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});
 const s=await authenticate(req,{securitySetup:true});if(!s)return NextResponse.json({error:'Autentificare necesară.'},{status:401});
 const x=schema.safeParse(await req.json().catch(()=>null));if(!x.success)return NextResponse.json({error:'Date invalide.'},{status:400});
 if(!encryptionReady())return NextResponse.json({error:'Protecția secretelor nu este încă configurată.'},{status:503});
 try{
  await securityLimit(`mfa:${s.id}`,10);
  const result=await withTransactionRetry(()=>db.$transaction(async tx=>{
   await tx.$queryRaw`SELECT id FROM "User" WHERE id=${s.id} FOR UPDATE`;
   const user=await tx.user.findUniqueOrThrow({where:{id:s.id}});
   if(!await compare(x.data.password,user.passwordHash))throw new SecurityError('Parolă sau cod incorect.',401);
   if(x.data.action==='BEGIN'){
    if(user.mfaEnabledAt)throw new SecurityError('Autentificarea în doi pași este deja activă.');
    const secret=newTotpSecret();await tx.user.update({where:{id:user.id},data:{mfaPendingSecret:seal(secret,'mfa'),mfaPendingExpiresAt:new Date(Date.now()+10*60_000)}});
    return {secret,uri:`otpauth://totp/${encodeURIComponent(`LaFix:${user.email}`)}?secret=${secret}&issuer=LaFix&algorithm=SHA1&digits=6&period=30`};
   }
   if(x.data.action==='ENABLE'){
    if(user.mfaEnabledAt||!user.mfaPendingSecret||!user.mfaPendingExpiresAt||user.mfaPendingExpiresAt<=new Date())throw new SecurityError('Reîncepe configurarea autentificării în doi pași.');
    const secret=unseal(user.mfaPendingSecret,'mfa'),counter=verifyTotp(secret,x.data.code||'');if(counter===null)throw new SecurityError('Cod incorect. Verifică ora telefonului.',401);
    const codes=recoveryCodes();await tx.user.update({where:{id:user.id},data:{mfaSecret:seal(secret,'mfa'),mfaEnabledAt:new Date(),mfaLastCounter:counter,mfaRecoveryHashes:codes.map(tokenHash),mfaPendingSecret:null,mfaPendingExpiresAt:null}});
    await tx.session.deleteMany({where:{userId:user.id}});const token=await issueToken(user.id,user.role,tx,true);
    await tx.auditEvent.create({data:{actorId:user.id,action:'MFA_ENABLED',resourceId:user.id}});return {codes,token};
   }
   if(x.data.action==='DISABLE'&&user.role==='ADMIN')throw new SecurityError('Administratorii trebuie să păstreze autentificarea în doi pași.',403);
   if(!await consumeMfa(tx,user,x.data.code||''))throw new SecurityError('Parolă sau cod incorect ori deja folosit.',401);
   const codes=x.data.action==='RECOVERY_CODES'?recoveryCodes():[];
   await tx.user.update({where:{id:user.id},data:x.data.action==='DISABLE'?{mfaSecret:null,mfaEnabledAt:null,mfaLastCounter:null,mfaRecoveryHashes:[]}:{mfaRecoveryHashes:codes.map(tokenHash)}});
   await tx.session.deleteMany({where:{userId:user.id}});const token=await issueToken(user.id,user.role,tx,x.data.action!=='DISABLE');await tx.auditEvent.create({data:{actorId:user.id,action:x.data.action==='DISABLE'?'MFA_DISABLED':'MFA_RECOVERY_REGENERATED',resourceId:user.id}});return {codes,token};
  },{timeout:15_000}));
  if('token' in result)await setSession(result.token!,s.role);
  return NextResponse.json({...result,message:'Configurare salvată.'},{headers});
 }catch(e){return NextResponse.json({error:e instanceof SecurityError?e.message:'Configurarea nu a putut fi salvată.'},{status:e instanceof SecurityError?e.status:503,headers})}
}
