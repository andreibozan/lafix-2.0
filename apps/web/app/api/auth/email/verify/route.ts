import {NextResponse} from 'next/server';
import {z} from 'zod';
import {verifyWriteOrigin} from '../../../../../lib/auth';
import {consumeAction,SecurityError} from '../../../../../lib/account-security';
const schema=z.object({token:z.string().regex(/^[A-Za-z0-9_-]{43}$/)});
export async function POST(req:Request){
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});
 const x=schema.safeParse(await req.json().catch(()=>null));if(!x.success)return NextResponse.json({error:'Link invalid.'},{status:400});
 try{await consumeAction(x.data.token,'VERIFY_EMAIL',async(tx,id)=>{await tx.user.update({where:{id},data:{emailVerifiedAt:new Date()}})});return NextResponse.json({message:'Email confirmat. Te poți autentifica.'})}catch(e){return NextResponse.json({error:e instanceof SecurityError?e.message:'Confirmarea nu a reușit.'},{status:e instanceof SecurityError?e.status:503})}
}
