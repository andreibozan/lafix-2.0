import {db} from './db';
import type {Prisma} from '@prisma/client';
import {ledgerTotals,type AdminQuery} from './admin-query.mjs';
export async function adminSummary(createdAt:AdminQuery['createdAt']){
 const [requests,matched,acceptedRequests,providerPending,proActive,customers,offerCount,openReports,requestStatuses,ledger,providers,activeSessions,pendingRequests]=await Promise.all([
  db.serviceRequest.count({where:{createdAt}}),db.serviceRequest.count({where:{createdAt,matches:{some:{}}}}),db.serviceRequest.count({where:{createdAt,status:{in:['ACCEPTED','CLOSED']}}}),
  db.providerProfile.count({where:{status:'PENDING'}}),db.providerProfile.count({where:{proUntil:{gt:new Date()}}}),db.user.count({where:{role:'CLIENT',createdAt}}),db.offer.count({where:{createdAt}}),db.leadReport.count({where:{status:'OPEN'}}),
  db.serviceRequest.groupBy({by:['status'],where:{createdAt},_count:{_all:true}}),db.billingTransaction.groupBy({by:['kind'],where:{createdAt},_sum:{amountBani:true}}),db.providerProfile.count({where:{createdAt}}),db.session.count({where:{expiresAt:{gt:new Date()}}}),db.serviceRequest.count({where:{qualification:'PENDING',status:{in:['OPEN','MATCHED','QUOTED']}}})
 ]);
 return {providers,activeSessions,pendingRequests,requests,matched,acceptedRequests,providerPending,proActive,customers,offerCount,openReports,matchRate:requests?Math.round(matched*100/requests):0,acceptRate:requests?Math.round(acceptedRequests*100/requests):0,requestStatuses:requestStatuses.map(g=>({status:g.status,count:g._count._all})),...ledgerTotals(ledger)};
}
export async function adminRows(query:AdminQuery){
 const {q,status,createdAt,page,pageSize,view}=query,skip=(page-1)*pageSize,take=pageSize;
 const text=(value:string)=>({contains:value,mode:'insensitive' as const});
 if(view==='requests'){
  const where:Prisma.ServiceRequestWhereInput={createdAt,...(status?(['PENDING','QUALIFIED','REJECTED'].includes(status)?{qualification:status as any}:{status:status as any}):{}),...(q?{OR:[{id:text(q)},{category:text(q)},{county:text(q)},{locality:text(q)},{contactName:text(q)},{contactEmail:text(q)}]}:{})};
  const [rows,total]=await Promise.all([db.serviceRequest.findMany({where,skip,take,orderBy:[{createdAt:'desc'},{id:'desc'}],select:{id:true,category:true,county:true,locality:true,description:true,contactName:true,contactEmail:true,contactPhone:true,status:true,qualification:true,qualificationNote:true,createdAt:true,budgetMin:true,budgetMax:true,leadPriceBani:true,matches:{select:{id:true,providerId:true,unlockedAt:true,refundedAt:true,pricePaidBani:true,provider:{select:{businessName:true}}}},offers:{select:{id:true,amount:true,status:true,createdAt:true,provider:{select:{businessName:true}}}}}}),db.serviceRequest.count({where})]);return {rows,total};
 }
 if(view==='providers'){
  const where:Prisma.ProviderProfileWhereInput={createdAt,...(status?{status:status as any}:{}),...(q?{OR:[{id:text(q)},{businessName:text(q)},{user:{email:text(q)}}]}:{})};
  const [rows,total]=await Promise.all([db.providerProfile.findMany({where,skip,take,orderBy:[{createdAt:'desc'},{id:'desc'}],select:{id:true,businessName:true,status:true,phone:true,categories:true,counties:true,creditBalance:true,proUntil:true,proCancelled:true,createdAt:true,user:{select:{id:true,name:true,email:true}},_count:{select:{matches:true,offers:true}}}}),db.providerProfile.count({where})]);return {rows,total};
 }
 if(view==='customers'){
  const where:Prisma.UserWhereInput={role:'CLIENT',createdAt,...(q?{OR:[{id:text(q)},{name:text(q)},{email:text(q)}]}:{})};const [rows,total]=await Promise.all([db.user.findMany({where,skip,take,orderBy:[{createdAt:'desc'},{id:'desc'}],select:{id:true,name:true,email:true,createdAt:true,_count:{select:{requests:true,sessions:{where:{expiresAt:{gt:new Date()}}}}}}}),db.user.count({where})]);return {rows,total};
 }
 if(view==='offers'){
  const where:Prisma.OfferWhereInput={createdAt,...(status?{status:status as any}:{}),...(q?{OR:[{id:text(q)},{requestId:text(q)},{provider:{businessName:text(q)}}]}:{})};const [rows,total]=await Promise.all([db.offer.findMany({where,skip,take,orderBy:[{createdAt:'desc'},{id:'desc'}],select:{id:true,requestId:true,amount:true,message:true,status:true,createdAt:true,provider:{select:{businessName:true}},request:{select:{category:true,locality:true,status:true}}}}),db.offer.count({where})]);return {rows,total};
 }
 if(view==='transactions'){
  const where:Prisma.BillingTransactionWhereInput={createdAt,...(status?{kind:status}:{}),...(q?{OR:[{id:text(q)},{reference:text(q)},{provider:{businessName:text(q)}}]}:{})};const [rows,total]=await Promise.all([db.billingTransaction.findMany({where,skip,take,orderBy:[{createdAt:'desc'},{id:'desc'}],select:{id:true,kind:true,amountBani:true,reference:true,createdAt:true,provider:{select:{businessName:true}}}}),db.billingTransaction.count({where})]);return {rows,total};
 }
 if(view==='reports'){
  const where:Prisma.LeadReportWhereInput={createdAt,...(status?{status:status as any}:{}),...(q?{OR:[{id:text(q)},{matchId:text(q)},{note:text(q)},{match:{provider:{businessName:text(q)}}}]}:{})};const [rows,total]=await Promise.all([db.leadReport.findMany({where,skip,take,orderBy:[{createdAt:'desc'},{id:'desc'}],include:{match:{select:{id:true,requestId:true,unlockedAt:true,refundedAt:true,provider:{select:{businessName:true}},request:{select:{category:true,locality:true,status:true}}}}}}),db.leadReport.count({where})]);return {rows,total};
 }
 const where:Prisma.AuditEventWhereInput={createdAt,...(q?{OR:[{action:text(q)},{actorId:text(q)},{resourceId:text(q)}]}:{})};const [rows,total]=await Promise.all([db.auditEvent.findMany({where,skip,take,orderBy:[{createdAt:'desc'},{id:'desc'}],select:{id:true,actorId:true,action:true,resourceId:true,note:true,createdAt:true}}),db.auditEvent.count({where})]);return {rows,total};
}
