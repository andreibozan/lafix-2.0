import {NextResponse} from 'next/server';
import {SignJWT,jwtVerify} from 'jose';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {cookies} from 'next/headers';
import {db} from '../../../../lib/db';
import {verifyWriteOrigin} from '../../../../lib/auth';
import {authConfigured,secureSessionCookie} from '../../../../lib/auth-policy.mjs';
import {requestSchema} from '../../../../lib/validation';
import {securityLimit,SecurityError} from '../../../../lib/account-security';
import {tokenHash} from '../../../../lib/account-crypto.mjs';
const cookieName='lafix_popup',headers={'Cache-Control':'no-store'},encoder=new TextEncoder();
const key=()=>encoder.encode(process.env.AUTH_SECRET!);
export async function GET(req:Request){
 if(!authConfigured())return NextResponse.json({error:'Solicitările nu sunt încă disponibile.'},{status:503});
 const site=req.headers.get('sec-fetch-site');if(site&&site!=='same-origin'&&site!=='none')return NextResponse.json({error:'Origine invalidă'},{status:403});
 if(req.headers.get('origin')&&req.headers.get('origin')!==process.env.APP_ORIGIN)return NextResponse.json({error:'Origine invalidă'},{status:403});
 try{await securityLimit('popup-tickets-global',1000,3600_000);const nonce=randomBytes(32).toString('base64url');const ticket=await new SignJWT({nonce}).setProtectedHeader({alg:'HS256'}).setAudience('lafix-popup').setIssuer('lafix').setJti(randomBytes(24).toString('hex')).setIssuedAt().setExpirationTime('10m').sign(key());const r=NextResponse.json({ticket},{headers});r.cookies.set(cookieName,nonce,{httpOnly:true,secure:secureSessionCookie(),sameSite:'strict',path:'/api/requests/popup',maxAge:600});return r}catch(e){return NextResponse.json({error:e instanceof SecurityError?e.message:'Conexiune indisponibilă.'},{status:e instanceof SecurityError?e.status:503,headers})}
}
const extra=z.object({ticket:z.string().max(1500),consent:z.literal(true),website:z.string().max(200).optional()});
export async function POST(req:Request){
 if(!verifyWriteOrigin(req))return NextResponse.json({error:'Origine invalidă'},{status:403});
 if(!authConfigured())return NextResponse.json({error:'Solicitările nu sunt disponibile.'},{status:503});
 try{
  const body=await req.text();if(body.length>12000)return NextResponse.json({error:'Solicitarea este prea lungă.'},{status:413});
  let raw:unknown;try{raw=JSON.parse(body)}catch{return NextResponse.json({error:'Date invalide.'},{status:400})}
  const data=requestSchema.safeParse(raw),proof=extra.safeParse(raw);if(!data.success||!proof.success||proof.data.website)return NextResponse.json({error:'Verifică datele și acordul de contact.'},{status:400});
  const {payload}=await jwtVerify(proof.data.ticket,key(),{algorithms:['HS256'],issuer:'lafix',audience:'lafix-popup'}),nonce=(await cookies()).get(cookieName)?.value;
  if(typeof payload.nonce!=='string'||typeof payload.jti!=='string'||!nonce||nonce.length!==payload.nonce.length||!timingSafeEqual(Buffer.from(nonce),Buffer.from(payload.nonce)))return NextResponse.json({error:'Redeschide fereastra și încearcă din nou.'},{status:403});
  await securityLimit('popup-submissions-global',100,3600_000);await securityLimit(`popup-email:${data.data.contactEmail.toLowerCase()}`,3,3600_000);
  const request=await db.$transaction(async tx=>{const r=await tx.serviceRequest.create({data:{...data.data,contactEmail:data.data.contactEmail.toLowerCase(),requestSource:'POPUP',consentAt:new Date(),guestTicketHash:tokenHash(payload.jti!)}});await tx.auditEvent.create({data:{actorId:'anonymous-popup',action:'GUEST_REQUEST_CREATED',resourceId:r.id}});return r});
  const response=NextResponse.json({id:request.id,status:request.status},{status:201,headers});response.cookies.set(cookieName,'',{path:'/api/requests/popup',maxAge:0,httpOnly:true,secure:secureSessionCookie(),sameSite:'strict'});return response;
 }catch(e){if(e instanceof SecurityError)return NextResponse.json({error:e.message},{status:e.status});if(typeof e==='object'&&e&&'code'in e&&e.code==='P2002')return NextResponse.json({error:'Solicitarea a fost deja trimisă.'},{status:409});return NextResponse.json({error:'Solicitarea nu a putut fi trimisă. Redeschide fereastra și încearcă din nou.'},{status:400,headers})}
}
