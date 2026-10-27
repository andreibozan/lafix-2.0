import assert from 'node:assert/strict';
import {seal,newTotpSecret,tokenHash,unseal} from '../../apps/web/lib/account-crypto.mjs';
export const syntheticRecovery='synthetic-recovery-code-for-tests';
export function adminSecurityData(){return {emailVerifiedAt:new Date(),mfaSecret:seal(newTotpSecret(),'mfa'),mfaEnabledAt:new Date(),mfaRecoveryHashes:[tokenHash(syntheticRecovery)]}}
export async function actionTokenForTest(db,email){
 assert.match(process.env.DATABASE_URL||'',/\/lafix_test(?:\?|$)/);
 const rows=await db.emailOutbox.findMany({where:{sentAt:null,payload:{not:''}},orderBy:{createdAt:'desc'},take:200});
 for(const row of rows){const message=JSON.parse(unseal(row.payload,'mail'));if(message.to===email){const url=message.text.match(/https?:\/\/\S+/)?.[0];if(url)return {token:new URLSearchParams(new URL(url).hash.slice(1)).get('token'),outboxId:row.id}}}
 throw Error('Synthetic email not found');
}
export async function verifiedAccount(base,db,body){
 const post=(path,data)=>fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
 const registered=await post('/api/auth/register',body);assert.equal(registered.status,201,await registered.clone().text());
 const action=await actionTokenForTest(db,body.email);assert.equal((await post('/api/auth/email/verify',{token:action.token})).status,200);await db.emailOutbox.delete({where:{id:action.outboxId}});
 const login=await post('/api/auth/login',{email:body.email,password:body.password});assert.equal(login.status,200);return login.json();
}
