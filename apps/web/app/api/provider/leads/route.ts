import {NextResponse} from 'next/server';
import {authenticate} from '../../../../lib/auth';
import {db} from '../../../../lib/db';
import {canAccessMatch,freeMarketplace} from '../../../../lib/marketplace-access.mjs';
import {leadPreview} from '../../../../lib/monetization.mjs';
export async function GET(req:Request){
 const s=await authenticate(req);if(s?.role!=='PROVIDER')return NextResponse.json({error:'Interzis'},{status:403});
 const p=await db.providerProfile.findUnique({where:{userId:s.id}});if(p?.status!=='APPROVED')return NextResponse.json({error:'Contul prestatorului trebuie aprobat'},{status:403});
 const matched=await db.requestMatch.findMany({where:{providerId:p.id},include:{request:true},orderBy:{createdAt:'desc'}});
 return NextResponse.json({leads:matched.map(m=>{
  const r=m.request,unlocked=canAccessMatch(m,r);
  return {id:r.id,matchId:m.id,category:r.category,county:r.county,locality:r.locality,status:r.status,qualification:r.qualification,createdAt:r.createdAt,budgetMin:r.budgetMin,budgetMax:r.budgetMax,priceBani:freeMarketplace()?0:r.leadPriceBani,unlocked,refunded:!!m.refundedAt,description:unlocked?r.description:leadPreview(r),...(unlocked?{contact:{name:r.contactName,email:r.contactEmail,phone:r.contactPhone}}:{})};
 })});
}
