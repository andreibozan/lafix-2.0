import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from './db';
import {verifyWriteOrigin} from './auth';
import {createAccountAction,securityLimit,SecurityError} from './account-security';
import {mailConfigured,deliverOutbox} from './mail-outbox.mjs';
const emailSchema=z.object({email:z.email().max(200)});
export async function requestAccountAction(req:Request,kind:'VERIFY_EMAIL'|'RESET_PASSWORD'){
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});
 const x=emailSchema.safeParse(await req.json().catch(()=>null));if(!x.success)return NextResponse.json({error:'Email invalid.'},{status:400});
 if(!mailConfigured())return NextResponse.json({error:'Serviciul de email nu este încă disponibil.'},{status:503});
 try{
  const email=x.data.email.toLowerCase();await securityLimit(`${kind}:${email}`,3,3600_000);
  await db.$transaction(async tx=>{const initial=await tx.user.findUnique({where:{email}});if(!initial)return;await tx.$queryRaw`SELECT id FROM "User" WHERE id=${initial.id} FOR UPDATE`;const user=await tx.user.findUniqueOrThrow({where:{id:initial.id}});if(kind==='VERIFY_EMAIL'&&user.emailVerifiedAt)return;await createAccountAction(tx,user,kind)});
  await deliverOutbox(db,1);
  return NextResponse.json({message:'Dacă există un cont eligibil, vei primi un email cu pașii următori.'},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return NextResponse.json({error:e instanceof SecurityError?e.message:'Solicitarea nu a putut fi procesată.'},{status:e instanceof SecurityError?e.status:503})}
}
