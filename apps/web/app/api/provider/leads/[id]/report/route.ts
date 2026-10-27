import {NextResponse} from 'next/server';
import {canAccessMatch} from '../../../../../../lib/marketplace-access.mjs';
import {z} from 'zod';
import {authenticate,verifyWriteOrigin} from '../../../../../../lib/auth';
import {BillingError,billingFailure,billingTransaction} from '../../../../../../lib/billing';
const schema=z.object({reason:z.enum(['INVALID_CONTACT','DUPLICATE','FALSE_REQUEST']),note:z.string().trim().min(10).max(500)});
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});const s=await authenticate(req);if(s?.role!=='PROVIDER')return NextResponse.json({error:'Interzis'},{status:403});
 const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Adaugă un motiv și o explicație de minimum 10 caractere.'},{status:400});
 const {id}=await params;
 try{await billingTransaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "ServiceRequest" WHERE id=${id} FOR UPDATE`;
  const p=await tx.providerProfile.findUnique({where:{userId:s.id}});if(p?.status!=='APPROVED')throw new BillingError('Interzis',403);
  const m=await tx.requestMatch.findUnique({where:{requestId_providerId:{requestId:id,providerId:p.id}},include:{request:true}});
  if(!m||!canAccessMatch(m,m.request))throw new BillingError('Oportunitate indisponibilă.',404);
  if(await tx.leadReport.findUnique({where:{matchId:m.id}}))return;
  await tx.leadReport.create({data:{matchId:m.id,reason:parsed.data.reason,note:parsed.data.note}});
  await tx.auditEvent.create({data:{actorId:s.id,action:'LEAD_REPORTED',resourceId:m.id,note:`${parsed.data.reason}: ${parsed.data.note}`}});
 });return NextResponse.json({ok:true,message:'Sesizarea a fost înregistrată pentru analiză. Nu produce automat o rambursare.'});}catch(e){const f=billingFailure(e);return NextResponse.json({error:f.error},{status:f.status})}
}
