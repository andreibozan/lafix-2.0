import { NextResponse } from 'next/server';
import { authenticate } from '../../../../lib/auth';
import { db } from '../../../../lib/db';
export async function GET(req:Request){const s=await authenticate(req);if(!s||s.role!=='CLIENT')return NextResponse.json({error:'Interzis'},{status:403});return NextResponse.json({requests:await db.serviceRequest.findMany({where:{clientId:s.id},include:{offers:{select:{id:true,amount:true,scope:true,materials:true,timeframe:true,warranty:true,message:true,status:true,provider:{select:{businessName:true}}}}},orderBy:{createdAt:'desc'}})})}
