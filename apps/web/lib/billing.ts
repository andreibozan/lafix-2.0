import {Prisma} from '@prisma/client';
import {db} from './db';
export const sandboxEnabled=()=>process.env.BILLING_MODE==='sandbox';
export class BillingError extends Error {constructor(message:string,public status=409){super(message)}}
// Retry complete serializable transactions only; callbacks contain no external side effects.
export async function billingTransaction<T>(fn:(tx:Prisma.TransactionClient)=>Promise<T>):Promise<T>{
 for(let attempt=0;;attempt++){
  try{return await db.$transaction(fn,{isolationLevel:Prisma.TransactionIsolationLevel.Serializable})}
  catch(e){if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==='P2034'&&attempt<3)continue;throw e}
 }
}
export function billingFailure(e:unknown){return {error:e instanceof BillingError?e.message:'Operațiunea nu a fost procesată. Încearcă din nou.',status:e instanceof BillingError?e.status:503}}
