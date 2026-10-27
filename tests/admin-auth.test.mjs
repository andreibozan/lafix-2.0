import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseAdminQuery,ledgerTotals} from '../apps/web/lib/admin-query.mjs';
import {loginDestination,secureSessionCookie,authConfigured,sessionDurationSeconds} from '../apps/web/lib/auth-policy.mjs';
test('role redirects reject unsafe and cross-role destinations',()=>{
 assert.equal(loginDestination('ADMIN','/dashboard/abonament'),'/admin');
 assert.equal(loginDestination('CLIENT','/admin'),'/dashboard');
 assert.equal(loginDestination('CLIENT','/dashboard/abonament'),'/dashboard');
 assert.equal(loginDestination('PROVIDER','/dashboard/abonament'),'/dashboard/abonament');
 assert.equal(loginDestination('PROVIDER','https://evil.invalid'),'/dashboard');
 assert.equal(loginDestination('PROVIDER','//evil.invalid'),'/dashboard');
});
test('production cookies remain secure except explicit loopback development',()=>{
 assert.equal(secureSessionCookie({NODE_ENV:'production',APP_ORIGIN:'http://example.com',ALLOW_LOCAL_HTTP_AUTH:'true'}),true);
 assert.equal(secureSessionCookie({NODE_ENV:'production',APP_ORIGIN:'http://127.0.0.1:3000',ALLOW_LOCAL_HTTP_AUTH:'true'}),false);
 assert.equal(secureSessionCookie({NODE_ENV:'production',APP_ORIGIN:'http://localhost:3000'}),true);
 assert.equal(secureSessionCookie({NODE_ENV:'production',APP_ORIGIN:'https://localhost',ALLOW_LOCAL_HTTP_AUTH:'true'}),true);
 assert.equal(sessionDurationSeconds('ADMIN'),7200);assert.equal(sessionDurationSeconds('CLIENT'),604800);
});
test('configuration state never treats an empty environment as ready',()=>{
 assert.equal(authConfigured({}),false);assert.equal(authConfigured({DATABASE_URL:'test',AUTH_SECRET:'short'}),false);
 assert.equal(authConfigured({DATABASE_URL:'test',AUTH_SECRET:'a'.repeat(32),APP_ORIGIN:'https://example.invalid'}),true);
});
test('admin query validates filters, pagination and inclusive UTC date range',()=>{
 const x=parseAdminQuery(new URLSearchParams('view=reports&status=OPEN&page=2&from=2026-10-01&to=2026-10-27'));
 assert.equal(x.page,2);assert.equal(x.pageSize,20);assert.equal(x.createdAt.lt.toISOString(),'2026-10-28T00:00:00.000Z');
 for(const query of ['view=secret','view=providers&status=ACCEPTED','from=2026-02-30','from=2026-10-27&to=2026-10-01','page=-1','page=1.5','page=999999'])assert.throws(()=>parseAdminQuery(new URLSearchParams(query)));
});
test('wallet topups are excluded from recognized demo revenue',()=>{
 const totals=ledgerTotals([{kind:'SANDBOX_TOPUP',_sum:{amountBani:500000}},{kind:'LEAD_UNLOCK',_sum:{amountBani:-4000}},{kind:'PRO_30_DAYS',_sum:{amountBani:-12900}},{kind:'LEAD_REFUND',_sum:{amountBani:2000}}]);
 assert.equal(totals.netRevenueBani,14900);assert.equal(totals.topupsBani,500000);assert.equal(totals.refundsBani,2000);
});
