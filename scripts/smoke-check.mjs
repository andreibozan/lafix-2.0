import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
function get(name){const u=new URL(name,root); assert.ok(existsSync(u),`${name} is missing`);return readFileSync(u,'utf8');}
const requests=get('apps/web/app/api/requests/route.ts');
assert.match(requests,/role!=='CLIENT'/);
assert.match(requests,/clientId:session\.id/);
const matching=get('apps/web/app/api/admin/match/route.ts');
assert.match(matching,/Serializable/);
assert.match(matching,/Math\.max\(0,3-existing\.length\)/);
for(const name of ['login','register']) assert.match(get(`apps/web/app/api/auth/${name}/route.ts`),/verifyWriteOrigin\(req\)/);
assert.doesNotMatch(get('apps/web/lib/auth.ts'),/x-lafix-mobile/);
get('docker-compose.yml');get('.github/workflows/checks.yml');get('apps/web/app/api/health/route.ts');
console.log('PASS: LaFix v0.4 static smoke checks');
