import { NextResponse } from 'next/server';
import { authenticate } from '../../../../lib/auth';
import { db } from '../../../../lib/db';
export async function GET(req:Request){const s=await authenticate(req);if(!s)return NextResponse.json({error:'Neautorizat'},{status:401});const u=await db.user.findUnique({where:{id:s.id},select:{id:true,name:true,email:true,role:true,provider:{select:{id:true,businessName:true,status:true,categories:true,counties:true}}}});if(!u)return NextResponse.json({error:'Cont inexistent'},{status:401});return NextResponse.json({user:u})}
