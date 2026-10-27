import {test} from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL;
test('HTTP: Romanian pages, authorization, malformed inputs and CSRF',{skip:!base},async()=>{
 for(const path of ['/','/account','/dashboard','/admin','/prestatori','/dashboard/abonament']){const r=await fetch(base+path);assert.equal(r.status,200);assert.match(await r.text(),/lang="ro"/);}
 for(const path of ['/api/auth/me','/api/admin/overview','/api/client/requests','/api/provider/leads','/api/offers','/api/provider/billing','/api/provider/templates']){assert.ok([401,403].includes((await fetch(base+path)).status));}
 for(const path of ['/api/auth/login','/api/auth/register','/api/requests','/api/offers','/api/auth/logout','/api/provider/billing/demo','/api/provider/leads/test/unlock','/api/provider/leads/test/report','/api/admin/requests/test/qualify','/api/admin/matches/test/refund']){const r=await fetch(base+path,{method:'POST',headers:{origin:'https://evil.invalid',cookie:'lafix_session=invalid','content-type':'application/json'},body:'{}'});assert.equal(r.status,403);}
 const bad=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:'{"role":"ADMIN"}'});assert.equal(bad.status,400);
});
