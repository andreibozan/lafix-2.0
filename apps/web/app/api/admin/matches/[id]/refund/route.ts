import {NextResponse} from 'next/server';
import {z} from 'zod';
import {authenticate,verifyWriteOrigin} from '../../../../../../lib/auth';
import {db} from '../../../../../../lib/db';
import {BillingError,billingTransaction,billingFailure,sandboxEnabled} from '../../../../../../lib/billing';
const schema=z.object({reason:z.enum(['INVALID_CONTACT','DUPLICATE','FALSE_REQUEST']),note:z.string().trim().min(10).max(500)});
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});const s=await authenticate(req);if(s?.role!=='ADMIN')return NextResponse.json({error:'Interzis'},{status:403});
 if(!sandboxEnabled())return NextResponse.json({error:'Rambursările de bani reali nu sunt activate.'},{status:503});
 const x=schema.safeParse(await req.json().catch(()=>null));if(!x.success)return NextResponse.json({error:'Motiv sau notă invalidă.'},{status:400});
 const {id}=await params;const initial=await db.requestMatch.findUnique({where:{id}});if(!initial)return NextResponse.json({error:'Oportunitate inexistentă.'},{status:404});
 try{await billingTransaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "ServiceRequest" WHERE id=${initial.requestId} FOR UPDATE`;
  const m=await tx.requestMatch.findUniqueOrThrow({where:{id},include:{request:true}});
  if(m.refundedAt)return;
  if(m.request.status==='ACCEPTED'||m.request.status==='CLOSED')throw new BillingError('Lucrarea are deja o ofertă acceptată. Necesită analiză separată.');
  if(!m.unlockedAt||m.pricePaidBani===null)throw new BillingError('Nu există o deblocare de rambursat.');
  await tx.providerProfile.update({where:{id:m.providerId},data:{creditBalance:{increment:m.pricePaidBani}}});
  await tx.requestMatch.update({where:{id},data:{refundedAt:new Date(),refundReason:x.data.reason}});
  await tx.offer.updateMany({where:{requestId:m.requestId,providerId:m.providerId,status:'SENT'},data:{status:'REJECTED'}});
  await tx.billingTransaction.create({data:{providerId:m.providerId,kind:'LEAD_REFUND',amountBani:m.pricePaidBani,reference:`refund:${id}`}});
  await tx.leadReport.updateMany({where:{matchId:id,status:'OPEN'},data:{status:'RESOLVED',resolvedAt:new Date(),resolvedBy:s.id,resolutionNote:x.data.note}});
  await tx.auditEvent.create({data:{actorId:s.id,action:'LEAD_REFUND_SANDBOX',resourceId:id,note:`${x.data.reason}: ${x.data.note}`}});
 });return NextResponse.json({ok:true,sandbox:true});}catch(e){const f=billingFailure(e);return NextResponse.json({error:f.error},{status:f.status})}
}
