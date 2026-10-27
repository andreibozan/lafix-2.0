import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {totp,base32,verifyTotp,seal,unseal,newToken,tokenHash,recoveryCodes} from '../apps/web/lib/account-crypto.mjs';
test('TOTP matches all RFC 6238 SHA-1 reference vectors and blocks replay',()=>{
 const secret=base32(Buffer.from('12345678901234567890'));
 for(const [seconds,expected] of [[59,'94287082'],[1111111109,'07081804'],[1111111111,'14050471'],[1234567890,'89005924'],[2000000000,'69279037'],[20000000000,'65353130']])assert.equal(totp(secret,seconds,8),expected);
 const code=totp(secret,1234567890),counter=verifyTotp(secret,code,null,1234567890);assert.equal(counter,41152263n);assert.equal(verifyTotp(secret,code,counter,1234567890),null);assert.equal(verifyTotp(secret,'abcdef',null,1234567890),null);
});
test('secrets are authenticated, encrypted and purpose-bound; recovery codes are unique',()=>{
 const prior=process.env.AUTH_ENCRYPTION_KEY;process.env.AUTH_ENCRYPTION_KEY=randomBytes(32).toString('base64');
 try{const encrypted=seal('synthetic-secret','mfa');assert.ok(!encrypted.includes('synthetic-secret'));assert.equal(unseal(encrypted,'mfa'),'synthetic-secret');assert.throws(()=>unseal(encrypted,'mail'));assert.throws(()=>unseal(encrypted.slice(0,-8),'mfa'));const token=newToken();assert.equal(token.length,43);assert.equal(tokenHash(token).length,64);const codes=recoveryCodes();assert.equal(new Set(codes).size,10)}finally{if(prior===undefined)delete process.env.AUTH_ENCRYPTION_KEY;else process.env.AUTH_ENCRYPTION_KEY=prior}
});
