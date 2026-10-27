export function loginDestination(role,next){
 if(role==='ADMIN')return '/admin';
 if(role==='PROVIDER'&&next==='/dashboard/abonament')return next;
 return '/dashboard';
}
export function authConfigured(env=process.env){
 if(!env.DATABASE_URL||!env.AUTH_SECRET||env.AUTH_SECRET.length<32||!env.APP_ORIGIN)return false;
 try{const origin=new URL(env.APP_ORIGIN);if(!['http:','https:'].includes(origin.protocol))return false;if(env.NODE_ENV==='production'&&origin.protocol==='http:')return env.ALLOW_LOCAL_HTTP_AUTH==='true'&&['127.0.0.1','localhost','[::1]'].includes(origin.hostname);return true}catch{return false}
}
export function secureSessionCookie(env=process.env){
 if(env.NODE_ENV!=='production')return false;
 try{const origin=new URL(env.APP_ORIGIN||'');return !(env.ALLOW_LOCAL_HTTP_AUTH==='true'&&origin.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(origin.hostname))}catch{return true}
}
export const sessionDurationSeconds=role=>role==='ADMIN'?7200:604800;
