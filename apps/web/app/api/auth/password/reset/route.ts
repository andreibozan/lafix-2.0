import {NextResponse} from 'next/server';
import {hash} from 'bcryptjs';
import {z} from 'zod';
import {verifyWriteOrigin,clearSession} from '../../../../../lib/auth';
import {db} from '../../../../../lib/db';
import {tokenHash} from '../../../../../lib/account-crypto.mjs';
import {consumeAction,SecurityError,securityLimit} from '../../../../../lib/account-security';
const schema=z.object({token:z.string().regex(/^[A-Za-z0-9_-]{43}$/),password:z.string().min(12).max(128).refine(v=>new TextEncoder().encode(v).length<=72)});
export async function POST(req:Request){
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});
 const x=schema.safeParse(await req.json().catch(()=>null));if(!x.success)return NextResponse.json({error:'Link invalid sau parolă prea scurtă (minimum 12 caractere). Maximum 72 de octeți.'},{status:400});
 try{const record=await db.accountActionToken.findUnique({where:{tokenHash:tokenHash(x.data.token)}});if(!record||record.kind!=='RESET_PASSWORD'||record.usedAt||record.expiresAt<=new Date())throw new SecurityError('Link invalid sau expirat.');await securityLimit(`reset:${record.userId}`,5);const passwordHash=await hash(x.data.password,12);await consumeAction(x.data.token,'RESET_PASSWORD',async(tx,id)=>{await tx.user.update({where:{id},data:{passwordHash,mfaPendingSecret:null,mfaPendingExpiresAt:null}});await tx.session.deleteMany({where:{userId:id}})});await clearSession();return NextResponse.json({message:'Parola a fost schimbată. Toate sesiunile au fost închise. Autentifică-te din nou.'})}catch(e){return NextResponse.json({error:e instanceof SecurityError?e.message:'Parola nu a putut fi schimbată.'},{status:e instanceof SecurityError?e.status:503})}
}
