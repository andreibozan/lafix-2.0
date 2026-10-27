export const LEAD_PRICE_BANI:number;
export const PRO_PRICE_BANI:number;
export const SANDBOX_TOPUP_BANI:number;
export function activePro(provider:{proUntil?:Date|string|null},now?:Date):boolean;
export function canUnlock(request:{qualification:string,status:string},match:{refundedAt?:Date|string|null}):boolean;
export function formatRon(bani:number):string;
export function leadPreview(request:{category:string,locality:string,county:string}):string;
