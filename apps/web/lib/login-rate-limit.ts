import {createHmac} from 'node:crypto';
import {db} from './db';
export async function consumeLoginAttempt(email:string){
 const id=createHmac('sha256',process.env.AUTH_SECRET!).update(email).digest('hex'),now=new Date(),end=new Date(now.getTime()+15*60_000);
 const rows=await db.$queryRaw<{attempts:number,resetAt:Date}[]>`INSERT INTO "AuthAttemptBucket" ("id","attempts","resetAt") VALUES (${id},1,${end}) ON CONFLICT ("id") DO UPDATE SET "attempts"=CASE WHEN "AuthAttemptBucket"."resetAt"<=${now} THEN 1 ELSE LEAST("AuthAttemptBucket"."attempts"+1,11) END,"resetAt"=CASE WHEN "AuthAttemptBucket"."resetAt"<=${now} THEN ${end} ELSE "AuthAttemptBucket"."resetAt" END RETURNING "attempts","resetAt"`;
 return {id,allowed:rows[0].attempts<=10,retryAfter:Math.max(1,Math.ceil((rows[0].resetAt.getTime()-now.getTime())/1000))};
}
