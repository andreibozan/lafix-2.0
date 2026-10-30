import {NextResponse} from 'next/server';
import {authenticate,verifyWriteOrigin} from '../../../../lib/auth';
import {db} from '../../../../lib/db';
import {z} from 'zod';
export async function GET(req:Request){const u=await authenticate(req);if(u?.role!=='PROVIDER')return NextResponse.json({error:'Interzis'},{status:403});const profile=await db.providerProfile.findUnique({where:{userId:u.id},select:{id:true,businessName:true,biography:true,availability:true,categories:true,counties:true,status:true}});return NextResponse.json({profile})}
export async function POST(req:Request){if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});const u=await authenticate(req);if(u?.role!=='PROVIDER')return NextResponse.json({error:'Interzis'},{status:403});const p=z.object({biography:z.string().trim().max(2000),availability:z.string().trim().max(300)}).safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({error:'Date invalide'},{status:400});await db.providerProfile.update({where:{userId:u.id},data:p.data});return NextResponse.json({ok:true})}
