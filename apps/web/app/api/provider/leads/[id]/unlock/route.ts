import {NextResponse} from 'next/server';
import {authenticate,verifyWriteOrigin} from '../../../../../../lib/auth';
import {BillingError,billingFailure,billingTransaction,sandboxEnabled} from '../../../../../../lib/billing';
import {canUnlock} from '../../../../../../lib/monetization.mjs';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});
 const session=await authenticate(req);if(session?.role!=='PROVIDER')return NextResponse.json({error:'Interzis'},{status:403});
 if(!sandboxEnabled())return NextResponse.json({error:'Plățile reale nu sunt activate. Nu a fost debitată nicio sumă.'},{status:503});
 const {id}=await params;
 try{
 const result=await billingTransaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "ServiceRequest" WHERE id=${id} FOR UPDATE`;
  const provider=await tx.providerProfile.findUnique({where:{userId:session.id}});
  if(provider?.status!=='APPROVED')throw new BillingError('Contul trebuie aprobat.',403);
  const match=await tx.requestMatch.findUnique({where:{requestId_providerId:{requestId:id,providerId:provider.id}},include:{request:true}});
  if(!match)throw new BillingError('Oportunitate indisponibilă.',404);
  if(match.refundedAt)throw new BillingError('Oportunitatea a fost rambursată. Accesul este închis.');
  if(match.unlockedAt)return {alreadyUnlocked:true};
  if(!canUnlock(match.request,match))throw new BillingError('Oportunitatea nu mai poate fi deblocată.');
  const amount=match.request.leadPriceBani;
  const debit=await tx.providerProfile.updateMany({where:{id:provider.id,status:'APPROVED',creditBalance:{gte:amount}},data:{creditBalance:{decrement:amount}}});
  if(debit.count!==1)throw new BillingError('Sold demonstrativ insuficient. Alimentează portofelul.',402);
  await tx.requestMatch.update({where:{id:match.id},data:{unlockedAt:new Date(),pricePaidBani:amount}});
  await tx.billingTransaction.create({data:{providerId:provider.id,kind:'LEAD_UNLOCK',amountBani:-amount,reference:`unlock:${match.id}`}});
  await tx.auditEvent.create({data:{actorId:session.id,action:'LEAD_UNLOCK_SANDBOX',resourceId:match.id}});
  return {alreadyUnlocked:false,paidBani:amount};
 });return NextResponse.json({...result,sandbox:true});
 }catch(e){const failure=billingFailure(e);return NextResponse.json({error:failure.error},{status:failure.status})}
}
