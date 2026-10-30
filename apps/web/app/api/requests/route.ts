import { NextResponse } from 'next/server';
import {notifyProject} from '../../../lib/project-notifications';
import { db } from '../../../lib/db';
import { requestSchema } from '../../../lib/validation';
import { authenticate } from '../../../lib/auth';
import { verifyWriteOrigin } from '../../../lib/auth';
export async function POST(req: Request) {
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});
 try {
  const raw=await req.json(); const parsed=requestSchema.safeParse(raw);
  if(!parsed.success) return NextResponse.json({error:'Date invalide',details:parsed.error.flatten()},{status:400});
  const session=await authenticate(req);
  if(!session || session.role!=='CLIENT') return NextResponse.json({error:'Autentifică-te ca utilizator pentru a trimite o solicitare'},{status:401});
  const request=await db.$transaction(async tx=>{const item=await tx.serviceRequest.create({data:{...parsed.data,clientId:session.id,consentAt:new Date()}});await notifyProject(tx,session.id,'Solicitarea ta LaFix a fost primită','Echipa va verifica solicitarea înainte de alocarea către maximum trei prestatori.');return item});
  return NextResponse.json({id:request.id,status:request.status},{status:201});
 } catch { return NextResponse.json({error:'Solicitarea nu a putut fi procesată'},{status:500}); }
}
