import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { requireAdmin, verifyWriteOrigin } from '../../../../lib/auth';
export async function POST(req:Request){
 if(!(await requireAdmin(req))) return NextResponse.json({error:'Interzis'},{status:403});
 if(!verifyWriteOrigin(req)) return NextResponse.json({error:'Origine invalidă'},{status:403});
 try {
  const {requestId}=await req.json();
  if(typeof requestId!=='string') return NextResponse.json({error:'requestId invalid'},{status:400});
  const result=await db.$transaction(async tx=>{
   await tx.$queryRaw`SELECT id FROM "ServiceRequest" WHERE id = ${requestId} FOR UPDATE`;
   const request=await tx.serviceRequest.findUnique({where:{id:requestId}});
   if(!request) throw new Error('NOT_FOUND');
   if(request.qualification!=='QUALIFIED') throw new Error('Califică cererea înainte de alocare.');
   if(request.status!=='OPEN' && request.status!=='MATCHED') throw new Error('INVALID_STATUS');
   const existing=await tx.requestMatch.findMany({where:{requestId},select:{providerId:true}});
   const slots=Math.max(0,3-existing.length);
   const providers=await tx.providerProfile.findMany({where:{status:'APPROVED',categories:{has:request.category},counties:{has:request.county},id:{notIn:existing.map(x=>x.providerId)}},orderBy:{createdAt:'asc'},take:slots});
   for(const p of providers) await tx.requestMatch.create({data:{requestId,providerId:p.id}});
   if(existing.length+providers.length>0) await tx.serviceRequest.update({where:{id:requestId},data:{status:'MATCHED'}});
   return {added:providers.length,total:existing.length+providers.length};
  });
  return NextResponse.json(result);
 } catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Eroare'},{status:400});}
}
