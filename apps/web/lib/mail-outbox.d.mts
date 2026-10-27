import type {PrismaClient} from '@prisma/client';
export function mailConfigured(env?:NodeJS.ProcessEnv):boolean;
export function deliverOutbox(db:PrismaClient,limit?:number):Promise<{sent:number}>;
