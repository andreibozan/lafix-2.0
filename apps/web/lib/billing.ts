import {Prisma} from '@prisma/client';
import {db} from './db';
import {withTransactionRetry} from './transaction-retry.mjs';
export const sandboxEnabled=()=>process.env.BILLING_MODE==='sandbox';
export class BillingError extends Error {constructor(message:string,public status=409){super(message)}}
export async function billingTransaction<T>(fn:(tx:Prisma.TransactionClient)=>Promise<T>):Promise<T>{
 return withTransactionRetry(()=>db.$transaction(fn,{isolationLevel:Prisma.TransactionIsolationLevel.Serializable}));
}
export function billingFailure(e:unknown){return {error:e instanceof BillingError?e.message:'Operațiunea nu a fost procesată. Încearcă din nou.',status:e instanceof BillingError?e.status:503}}
