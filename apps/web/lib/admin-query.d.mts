export const ADMIN_VIEWS:string[];
export const ADMIN_STATUSES:Record<string,string[]>;
export type AdminQuery={view:string,q:string,status:string,page:number,pageSize:number,from:string,to:string,createdAt:{gte?:Date,lt?:Date}};
export function parseAdminQuery(params:URLSearchParams):AdminQuery;
export function ledgerTotals(groups:{kind:string,_sum:{amountBani:number|null}}[]):{topupsBani:number,leadSalesBani:number,proSalesBani:number,refundsBani:number,netRevenueBani:number};
