import type {Prisma} from '@prisma/client';
import {seal} from './account-crypto.mjs';
import {mailConfigured} from './mail-outbox.mjs';
// Only verified account addresses receive project mail. Guest contact fields are never trusted recipients.
export async function notifyProject(tx:Prisma.TransactionClient,userId:string|null,subject:string,text:string){
 if(!userId||!mailConfigured())return;
 const user=await tx.user.findUnique({where:{id:userId},select:{email:true,emailVerifiedAt:true}});if(!user?.emailVerifiedAt)return;
 await tx.emailOutbox.create({data:{payload:seal(JSON.stringify({to:user.email,subject,text:`${text}\n\nConsultează contul tău LaFix pentru detalii.`}),'mail'),expiresAt:new Date(Date.now()+48*3600_000)}});
}
