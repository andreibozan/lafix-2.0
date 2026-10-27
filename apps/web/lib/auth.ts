import {randomUUID} from 'node:crypto';
import {db} from './db';
import {SignJWT,jwtVerify} from 'jose';
import {cookies} from 'next/headers';
import type {Role,Prisma} from '@prisma/client';
import {secureSessionCookie,sessionDurationSeconds} from './auth-policy.mjs';
const name='lafix_session',verifyOptions={algorithms:['HS256'],issuer:'lafix',audience:'lafix-app'};
function secret(){if(!process.env.AUTH_SECRET||process.env.AUTH_SECRET.length<32)throw Error('AUTH_SECRET must be at least 32 characters');return new TextEncoder().encode(process.env.AUTH_SECRET)}
export async function issueToken(id:string,role:Role,store:Pick<Prisma.TransactionClient,'session'>=db){const sid=randomUUID(),duration=sessionDurationSeconds(role);const token=await new SignJWT({role}).setJti(sid).setProtectedHeader({alg:'HS256'}).setIssuer('lafix').setAudience('lafix-app').setSubject(id).setIssuedAt().setExpirationTime(`${duration}s`).sign(secret());await store.session.create({data:{id:sid,userId:id,expiresAt:new Date(Date.now()+duration*1000)}});return token}
export async function authenticate(request?:Request):Promise<{id:string,role:Role}|null>{
 try{const bearer=request?.headers.get('authorization');const token=bearer?.startsWith('Bearer ')?bearer.slice(7):(await cookies()).get(name)?.value;if(!token)return null;const {payload}=await jwtVerify(token,secret(),verifyOptions);if(typeof payload.sub!=='string'||typeof payload.jti!=='string')return null;const session=await db.session.findUnique({where:{id:payload.jti},include:{user:true}});if(!session||session.expiresAt<=new Date()||session.userId!==payload.sub)return null;return {id:session.userId,role:session.user.role}}catch{return null}
}
export async function setSession(token:string,role:Role='CLIENT'){(await cookies()).set(name,token,{httpOnly:true,secure:secureSessionCookie(),sameSite:'lax',path:'/',maxAge:sessionDurationSeconds(role)})}
export async function clearSession(){(await cookies()).delete(name)}
export function verifyWriteOrigin(req:Request):boolean{
 if(!req.headers.get('origin')&&!req.headers.get('cookie')&&req.headers.get('authorization')?.startsWith('Bearer '))return true;
 const origin=req.headers.get('origin');if(!origin)return !req.headers.get('cookie')&&req.headers.get('content-type')?.includes('application/json')===true;
 try{const expected=process.env.APP_ORIGIN||(process.env.NODE_ENV!=='production'?new URL(req.url).origin:'');return new URL(origin).origin===new URL(expected).origin}catch{return false}
}
export async function requireAdmin(req:Request){return (await authenticate(req))?.role==='ADMIN'}
export async function revokeSession(req:Request){const authorization=req.headers.get('authorization');const token=authorization?.startsWith('Bearer ')?authorization.slice(7):(await cookies()).get(name)?.value;if(!token)return;let sid:string|undefined;try{const {payload}=await jwtVerify(token,secret(),verifyOptions);sid=payload.jti}catch{return}if(sid)await db.$transaction(async tx=>{const session=await tx.session.findUnique({where:{id:sid}});if(!session)return;const removed=await tx.session.deleteMany({where:{id:sid}});if(removed.count)await tx.auditEvent.create({data:{actorId:session.userId,action:'AUTH_SESSION_REVOKED',resourceId:session.userId}})})}
