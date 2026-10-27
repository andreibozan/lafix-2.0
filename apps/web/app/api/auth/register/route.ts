import {authConfigured,loginDestination} from '../../../../lib/auth-policy.mjs';
import { verifyWriteOrigin } from '../../../../lib/auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import { db } from '../../../../lib/db';
import { issueToken,setSession } from '../../../../lib/auth';
const schema=z.object({email:z.email().max(200),name:z.string().trim().min(2).max(100),password:z.string().min(12).max(72).refine(v=>new TextEncoder().encode(v).length<=72),role:z.enum(['CLIENT','PROVIDER']),businessName:z.string().trim().min(2).max(150).optional(),phone:z.string().trim().min(8).max(25).optional(),categories:z.array(z.string().min(2)).max(9).optional(),counties:z.array(z.string().min(2)).max(42).optional()});
export async function POST(req:Request){if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});try{
 const p=schema.safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({error:'Date invalide',details:p.error.flatten()},{status:400});const x=p.data;
 if(!authConfigured())return NextResponse.json({error:"Înregistrarea necesită conectarea bazei de date."},{status:503});
 if(x.role==='PROVIDER'&&(!x.businessName||!x.phone||!x.categories?.length||!x.counties?.length))return NextResponse.json({error:'Datele prestatorului sunt obligatorii'},{status:400});
 const passwordHash=await hash(x.password,12);
 const {user,token}=await db.$transaction(async tx=>{const user=await tx.user.create({data:{email:x.email.toLowerCase(),name:x.name,passwordHash,role:x.role,...(x.role==='PROVIDER'?{provider:{create:{businessName:x.businessName!,phone:x.phone!,categories:x.categories!,counties:x.counties!}}}:{})},select:{id:true,name:true,email:true,role:true}});
 const token=await issueToken(user.id,user.role,tx);await tx.auditEvent.create({data:{actorId:user.id,action:'AUTH_REGISTER',resourceId:user.id}});return {user,token}});await setSession(token,user.role);return NextResponse.json({user,token,redirectTo:loginDestination(user.role)},{status:201});
 }catch(e){if(typeof e==='object'&&e!==null&&'code'in e&&e.code==='P2002')return NextResponse.json({error:'Email deja folosit'},{status:409});return NextResponse.json({error:'Nu am putut crea contul'},{status:500})}}
