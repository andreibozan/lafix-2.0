import {NextResponse} from 'next/server';
import {db} from '../../../../../lib/db';
import {z} from 'zod';
import {authenticate,verifyWriteOrigin} from '../../../../../lib/auth';
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const s=await authenticate(req);if(s?.role!=='ADMIN')return NextResponse.json({error:'Interzis'},{status:403});
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});
 const data=z.object({status:z.enum(['PENDING','APPROVED','SUSPENDED'])}).safeParse(await req.json().catch(()=>null));if(!data.success)return NextResponse.json({error:'Status invalid'},{status:400});
 try{const {id}=await params;const p=await db.$transaction(async tx=>{const profile=await tx.providerProfile.update({where:{id},data:data.data,select:{id:true,businessName:true,status:true}});await tx.auditEvent.create({data:{actorId:s.id,action:`PROVIDER_${data.data.status}`,resourceId:id}});return profile});return NextResponse.json({provider:p})}catch{return NextResponse.json({error:'Prestator inexistent'},{status:404})}
}
