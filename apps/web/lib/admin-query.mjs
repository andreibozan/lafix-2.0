export const ADMIN_VIEWS=['requests','providers','customers','offers','transactions','reports','audit'];
export const ADMIN_STATUSES={requests:['OPEN','MATCHED','QUOTED','ACCEPTED','CLOSED','CANCELLED','PENDING','QUALIFIED','REJECTED'],providers:['PENDING','APPROVED','SUSPENDED'],customers:[],offers:['SENT','ACCEPTED','REJECTED'],transactions:['SANDBOX_TOPUP','LEAD_UNLOCK','LEAD_REFUND','PRO_30_DAYS'],reports:['OPEN','RESOLVED','DISMISSED'],audit:[]};
function date(value){if(!value)return undefined;if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('Dată invalidă.');const d=new Date(value+'T00:00:00Z');if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==value)throw Error('Dată invalidă.');return d}
export function parseAdminQuery(params){
 const view=params.get('view')||'requests',q=(params.get('q')||'').trim(),status=params.get('status')||'';
 if(!ADMIN_VIEWS.includes(view)||q.length>100||status&&!ADMIN_STATUSES[view].includes(status))throw Error('Filtre invalide.');
 const page=Number(params.get('page')||1);if(!Number.isSafeInteger(page)||page<1||page>10000)throw Error('Pagină invalidă.');
 const from=params.get('from')||'',to=params.get('to')||'',gte=date(from),end=date(to);if(gte&&end&&gte>end)throw Error('Interval invalid.');
 return {view,q,status,page,pageSize:20,from,to,createdAt:{...(gte?{gte}:{}),...(end?{lt:new Date(end.getTime()+86400000)}:{})}};
}
export function ledgerTotals(groups){const totals=Object.fromEntries(groups.map(g=>[g.kind,g._sum.amountBani||0]));return {topupsBani:totals.SANDBOX_TOPUP||0,leadSalesBani:-(totals.LEAD_UNLOCK||0),proSalesBani:-(totals.PRO_30_DAYS||0),refundsBani:totals.LEAD_REFUND||0,netRevenueBani:-(totals.LEAD_UNLOCK||0)-(totals.PRO_30_DAYS||0)-(totals.LEAD_REFUND||0)}};
