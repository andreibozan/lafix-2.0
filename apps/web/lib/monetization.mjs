// Prices are experimental sandbox amounts, in integer bani (100 bani = 1 RON).
export const LEAD_PRICE_BANI=2000;
export const PRO_PRICE_BANI=12900;
export const SANDBOX_TOPUP_BANI=20000;
export function activePro(provider,now=new Date()){
 return !!provider.proUntil && new Date(provider.proUntil).getTime()>now.getTime();
}
export function canUnlock(request,match){
 return request.qualification==='QUALIFIED' && ['OPEN','MATCHED','QUOTED'].includes(request.status) && !match.refundedAt;
}
export function formatRon(bani){return new Intl.NumberFormat('ro-RO',{style:'currency',currency:'RON'}).format(bani/100)}
// Free-text descriptions may contain personal contact information. They are released
// only after unlocking. The locked preview is deliberately built from structured fields.
export function leadPreview(request){return `Proiect de ${request.category.toLocaleLowerCase('ro-RO')} în ${request.locality}, ${request.county}.`}
