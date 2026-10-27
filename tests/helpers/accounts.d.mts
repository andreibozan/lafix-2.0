import type {PrismaClient} from '@prisma/client';
export const syntheticRecovery:string;
export function adminSecurityData():{emailVerifiedAt:Date;mfaSecret:string;mfaEnabledAt:Date;mfaRecoveryHashes:string[]};
export function actionTokenForTest(db:PrismaClient,email:string):Promise<{token:string;outboxId:string}>;
export function verifiedAccount(base:string,db:PrismaClient,body:any):Promise<any>;
