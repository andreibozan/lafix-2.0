import {randomBytes,createHash,createHmac,createCipheriv,createDecipheriv,timingSafeEqual} from 'node:crypto';
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function encryptionReady(env=process.env){try{return Buffer.from(env.AUTH_ENCRYPTION_KEY||'','base64').length===32}catch{return false}}
function key(){if(!encryptionReady())throw Error('Account encryption is not configured');return Buffer.from(process.env.AUTH_ENCRYPTION_KEY,'base64')}
export function seal(value,purpose){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(),iv);cipher.setAAD(Buffer.from(purpose));const encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return [iv,cipher.getAuthTag(),encrypted].map(b=>b.toString('base64url')).join('.')}
export function unseal(value,purpose){const parts=value.split('.');if(parts.length!==3)throw Error('Invalid encrypted value');const [iv,tag,data]=parts.map(p=>Buffer.from(p,'base64url'));const decipher=createDecipheriv('aes-256-gcm',key(),iv);decipher.setAAD(Buffer.from(purpose));decipher.setAuthTag(tag);return Buffer.concat([decipher.update(data),decipher.final()]).toString('utf8')}
export const tokenHash=value=>createHash('sha256').update(value).digest('hex');
export const newToken=()=>randomBytes(32).toString('base64url');
export function base32(buffer){let bits=0,value=0,result='';for(const byte of buffer){value=(value<<8)|byte;bits+=8;while(bits>=5){result+=alphabet[(value>>>(bits-5))&31];bits-=5}}if(bits)result+=alphabet[(value<<(5-bits))&31];return result}
function fromBase32(value){let bits=0,buffer=0,result=[];for(const char of value.toUpperCase().replace(/=+$/,'')){const n=alphabet.indexOf(char);if(n<0)throw Error('Invalid authenticator secret');buffer=(buffer<<5)|n;bits+=5;if(bits>=8){result.push((buffer>>>(bits-8))&255);bits-=8}}return Buffer.from(result)}
export const newTotpSecret=()=>base32(randomBytes(20));
export function totp(secret,seconds=Date.now()/1000,digits=6){const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(seconds/30)));const hash=createHmac('sha1',fromBase32(secret)).update(counter).digest(),offset=hash[hash.length-1]&15;return String((hash.readUInt32BE(offset)&0x7fffffff)%10**digits).padStart(digits,'0')}
export function verifyTotp(secret,code,lastCounter=null,seconds=Date.now()/1000){if(!/^\d{6}$/.test(code))return null;const current=Math.floor(seconds/30);for(const shift of [0,-1,1]){const counter=current+shift;if(counter<0||(lastCounter!==null&&BigInt(counter)<=BigInt(lastCounter)))continue;const expected=totp(secret,counter*30);if(timingSafeEqual(Buffer.from(expected),Buffer.from(code)))return BigInt(counter)}return null}
export function recoveryCodes(){return Array.from({length:10},()=>randomBytes(10).toString('hex'))}
