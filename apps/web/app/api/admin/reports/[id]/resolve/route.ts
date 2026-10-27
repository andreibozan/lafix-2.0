import {NextResponse} from 'next/server';
import {z} from 'zod';
import {authenticate,verifyWriteOrigin} from '../../../../../../lib/auth';
import {BillingError,billingFailure,billingTransaction} from '../../../../../../lib/billing';
const schema=z.object({status:z.enum(['RESOLVED','DISMISSED']),note:z.string().trim().min(10).max(500)});
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});const s=await authenticate(req);if(s?.role!=='ADMIN')return NextResponse.json({error:'Interzis'},{status:403});const x=schema.safeParse(await req.json().catch(()=>null));if(!x.success)return NextResponse.json({error:'Completează rezoluția și nota.'},{status:400});const {id}=await params;
 try{await billingTransaction(async tx=>{const report=await tx.leadReport.findUnique({where:{id}});if(!report)throw new BillingError('Sesizare inexistentă.',404);const updated=await tx.leadReport.updateMany({where:{id,status:'OPEN'},data:{status:x.data.status,resolutionNote:x.data.note,resolvedBy:s.id,resolvedAt:new Date()}});if(updated.count===1)await tx.auditEvent.create({data:{actorId:s.id,action:`REPORT_${x.data.status}`,resourceId:id,note:x.data.note}})});return NextResponse.json({ok:true})}catch(e){const f=billingFailure(e);return NextResponse.json({error:f.error},{status:f.status})}
}
