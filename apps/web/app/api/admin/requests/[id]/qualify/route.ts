import {NextResponse} from 'next/server';
import {z} from 'zod';
import {authenticate,verifyWriteOrigin} from '../../../../../../lib/auth';
import {BillingError,billingTransaction,billingFailure} from '../../../../../../lib/billing';
import {LEAD_PRICE_BANI} from '../../../../../../lib/monetization.mjs';
const schema=z.discriminatedUnion('decision',[
 z.object({decision:z.literal('QUALIFIED'),contactConfirmed:z.literal(true),intentConfirmed:z.literal(true),detailsComplete:z.literal(true),note:z.string().trim().min(10).max(500)}),
 z.object({decision:z.literal('REJECTED'),note:z.string().trim().min(10).max(500)})
]);
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});const s=await authenticate(req);if(s?.role!=='ADMIN')return NextResponse.json({error:'Interzis'},{status:403});
 const x=schema.safeParse(await req.json().catch(()=>null));if(!x.success)return NextResponse.json({error:'Confirmă contactul, intenția și detaliile și adaugă o notă.'},{status:400});
 const {id}=await params;
 try{await billingTransaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "ServiceRequest" WHERE id=${id} FOR UPDATE`;
  const r=await tx.serviceRequest.findUnique({where:{id}});if(!r)throw new BillingError('Cerere inexistentă.',404);
  if(!['OPEN','MATCHED','QUOTED'].includes(r.status))throw new BillingError('Cererea este închisă.');
  if(x.data.decision==='REJECTED'&&await tx.requestMatch.count({where:{requestId:id,unlockedAt:{not:null},refundedAt:null}}))throw new BillingError('Rambursează mai întâi oportunitățile deblocate.');
  await tx.serviceRequest.update({where:{id},data:{qualification:x.data.decision,qualificationNote:x.data.note,qualifiedBy:s.id,qualifiedAt:x.data.decision==='QUALIFIED'?new Date():null,leadPriceBani:LEAD_PRICE_BANI}});
  await tx.auditEvent.create({data:{actorId:s.id,action:`REQUEST_${x.data.decision}`,resourceId:id,note:x.data.note}});
 });return NextResponse.json({ok:true});}catch(e){const f=billingFailure(e);return NextResponse.json({error:f.error},{status:f.status})}
}
