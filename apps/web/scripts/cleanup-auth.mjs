import {PrismaClient} from '@prisma/client';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const env=fileURLToPath(new URL('../.env',import.meta.url));if(existsSync(env))process.loadEnvFile(env);
const db=new PrismaClient();
try{const now=new Date();const [sessions,buckets,tokens,emails]=await db.$transaction([db.session.deleteMany({where:{expiresAt:{lte:now}}}),db.authAttemptBucket.deleteMany({where:{resetAt:{lte:now}}}),db.accountActionToken.deleteMany({where:{expiresAt:{lte:now}}}),db.emailOutbox.deleteMany({where:{expiresAt:{lte:now}}})]);console.log(`Înregistrări expirate curățate: ${sessions.count} sesiuni, ${buckets.count} contoare, ${tokens.count} linkuri și ${emails.count} emailuri.`)}catch{console.error('Curățarea a eșuat; verifică baza de date și migrarea.');process.exitCode=1}finally{await db.$disconnect()}
