import {randomUUID} from 'node:crypto';
import {NextResponse} from 'next/server';
import {authenticate,verifyWriteOrigin} from '../../../../lib/auth';
import {db} from '../../../../lib/db';
import {activePro,PRO_PRICE_BANI,LEAD_PRICE_BANI,SANDBOX_TOPUP_BANI} from '../../../../lib/monetization.mjs';
import {sandboxEnabled} from '../../../../lib/billing';
export async function GET(req:Request){
 const s=await authenticate(req);if(s?.role!=='PROVIDER')return NextResponse.json({error:'Interzis'},{status:403});
 const p=await db.providerProfile.findUnique({where:{userId:s.id},include:{transactions:{orderBy:{createdAt:'desc'},take:20}}});
 if(!p)return NextResponse.json({error:'Profil inexistent'},{status:404});
 const pro=activePro(p);
 const stats=pro?await Promise.all([db.requestMatch.count({where:{providerId:p.id,unlockedAt:{not:null},refundedAt:null}}),db.offer.count({where:{providerId:p.id}}),db.offer.count({where:{providerId:p.id,status:'ACCEPTED'}})]):null;
 return NextResponse.json({operationKey:randomUUID(),sandbox:sandboxEnabled(),balanceBani:p.creditBalance,pro,proUntil:p.proUntil,proCancelled:p.proCancelled,transactions:p.transactions,stats:stats?{unlocked:stats[0],offers:stats[1],accepted:stats[2]}:null,prices:{leadBani:LEAD_PRICE_BANI,proBani:PRO_PRICE_BANI,topupBani:SANDBOX_TOPUP_BANI}});
}
export async function PATCH(req:Request){
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});
 const s=await authenticate(req);if(s?.role!=='PROVIDER')return NextResponse.json({error:'Interzis'},{status:403});
 const p=await db.providerProfile.findUnique({where:{userId:s.id}});if(!p)return NextResponse.json({error:'Profil inexistent'},{status:404});
 await db.$transaction(async tx=>{await tx.providerProfile.update({where:{id:p.id},data:{proCancelled:true}});await tx.auditEvent.create({data:{actorId:s.id,action:'PRO_CANCEL',resourceId:p.id}})});
 return NextResponse.json({ok:true,message:'Preferință salvată. Pro rămâne activ până la expirare, fără debitări automate.'});
}
