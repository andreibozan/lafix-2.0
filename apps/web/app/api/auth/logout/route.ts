import { NextResponse } from 'next/server';
import { clearSession, revokeSession, verifyWriteOrigin } from '../../../../lib/auth';
export async function POST(req:Request){if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});await revokeSession(req);await clearSession();return NextResponse.json({ok:true})}
