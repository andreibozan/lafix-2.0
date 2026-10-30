import {NextResponse} from 'next/server';
import {authenticate,verifyWriteOrigin} from '../../../../../../lib/auth';
import {db} from '../../../../../../lib/db';
import {z} from 'zod';
const schema=z.discriminatedUnion('action',[z.object({action:z.literal('COMPLETE')}),z.object({action:z.literal('CANCEL')}),z.object({action:z.literal('REVIEW'),rating:z.number().int().min(1).max(5),text:z.string().trim().min(10).max(2000)})]);
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});
 const user=await authenticate(req);if(user?.role!=='CLIENT')return NextResponse.json({error:'Interzis'},{status:403});
 const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Date invalide'},{status:400});
 const {id}=await params;try{await db.$transaction(async tx=>{
 await tx.$queryRaw`SELECT id FROM "ServiceRequest" WHERE id=${id} FOR UPDATE`;
 const item=await tx.serviceRequest.findUnique({where:{id}});if(!item||item.clientId!==user.id)throw Error();
 const input=parsed.data;
 if(input.action==='COMPLETE'){if(item.status!=='ACCEPTED')throw Error();await tx.serviceRequest.update({where:{id},data:{status:'CLOSED',completedAt:new Date()}})}
 else if(input.action==='CANCEL'){if(!['OPEN','MATCHED','QUOTED'].includes(item.status))throw Error();await tx.serviceRequest.update({where:{id},data:{status:'CANCELLED'}});await tx.offer.updateMany({where:{requestId:id,status:'SENT'},data:{status:'REJECTED'}})}
 else {if(item.status!=='CLOSED'||!item.completedAt||item.reviewRating!==null||!await tx.offer.count({where:{requestId:id,status:'ACCEPTED'}}))throw Error();await tx.serviceRequest.update({where:{id},data:{reviewRating:input.rating,reviewText:input.text,reviewPublished:false}})}
 await tx.auditEvent.create({data:{actorId:user.id,resourceId:id,action:`PROJECT_${input.action}`}});
 });return NextResponse.json({ok:true})}catch{return NextResponse.json({error:'Acțiunea nu este disponibilă pentru acest proiect.'},{status:409})}
}
