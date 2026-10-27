import { NextResponse } from 'next/server';
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
  const request=await db.serviceRequest.create({data:{...parsed.data,clientId:session.id}});
  return NextResponse.json({id:request.id,status:request.status},{status:201});
 } catch { return NextResponse.json({error:'Solicitarea nu a putut fi procesată'},{status:500}); }
}
