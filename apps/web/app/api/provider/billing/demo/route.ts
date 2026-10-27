import {NextResponse} from 'next/server';
import {z} from 'zod';
import {authenticate,verifyWriteOrigin} from '../../../../../lib/auth';
import {BillingError,billingTransaction,billingFailure,sandboxEnabled} from '../../../../../lib/billing';
import {PRO_PRICE_BANI,SANDBOX_TOPUP_BANI,activePro} from '../../../../../lib/monetization.mjs';
const schema=z.object({action:z.enum(['TOPUP','PRO']),idempotencyKey:z.uuid()});
export async function POST(req:Request){
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});
 const s=await authenticate(req);if(s?.role!=='PROVIDER')return NextResponse.json({error:'Interzis'},{status:403});
 if(!sandboxEnabled())return NextResponse.json({error:'Modul demonstrativ este dezactivat. Plățile reale nu sunt disponibile.'},{status:503});
 const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Date invalide'},{status:400});
 try{const result=await billingTransaction(async tx=>{
  const provider=await tx.providerProfile.findUnique({where:{userId:s.id}});if(provider?.status!=='APPROVED')throw new BillingError('Profil neaprobat.',403);
  await tx.$queryRaw`SELECT id FROM "ProviderProfile" WHERE id=${provider.id} FOR UPDATE`;
  const p=await tx.providerProfile.findUniqueOrThrow({where:{id:provider.id}});
  const reference=`demo:${p.id}:${parsed.data.action}:${parsed.data.idempotencyKey}`;
  if(await tx.billingTransaction.findUnique({where:{reference}}))return {alreadyProcessed:true};
  if(parsed.data.action==='TOPUP'){
   if(p.creditBalance>1_000_000)throw new BillingError('Soldul demonstrativ maxim a fost atins.');
   await tx.providerProfile.update({where:{id:p.id},data:{creditBalance:{increment:SANDBOX_TOPUP_BANI}}});
   await tx.billingTransaction.create({data:{providerId:p.id,kind:'SANDBOX_TOPUP',amountBani:SANDBOX_TOPUP_BANI,reference}});
  }else{
   if(activePro(p))throw new BillingError('Ai deja acces Pro activ.');
   if(p.creditBalance<PRO_PRICE_BANI)throw new BillingError('Sold demonstrativ insuficient.',402);
   await tx.providerProfile.update({where:{id:p.id},data:{creditBalance:{decrement:PRO_PRICE_BANI},proUntil:new Date(Date.now()+30*86400000),proCancelled:false}});
   await tx.billingTransaction.create({data:{providerId:p.id,kind:'PRO_30_DAYS',amountBani:-PRO_PRICE_BANI,reference}});
  }
  await tx.auditEvent.create({data:{actorId:s.id,action:`SANDBOX_${parsed.data.action}`,resourceId:p.id}});return {alreadyProcessed:false};
 });return NextResponse.json({...result,sandbox:true});}catch(e){const f=billingFailure(e);return NextResponse.json({error:f.error},{status:f.status})}
}
