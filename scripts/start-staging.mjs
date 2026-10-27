import {spawnSync, spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
function reject(message) { console.error(message); process.exit(1); }
if (process.env.DEPLOYMENT_STAGE !== 'staging') reject('This launcher is for staging only.');
if (process.env.BILLING_MODE !== 'disabled') reject('Real and sandbox billing must remain disabled in this staging configuration.');
if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) reject('Set a private AUTH_SECRET of at least 32 characters.');
if (!process.env.STAGING_ACCESS_PASSWORD || process.env.STAGING_ACCESS_PASSWORD.length < 20) reject('Set a private staging access password of at least 20 characters.');
try {
  const database = new URL(process.env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(database.protocol) || database.pathname !== '/lafix_staging') throw Error();
} catch { reject('Use a separate PostgreSQL database named lafix_staging.'); }
try {
  const origin = new URL(process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL);
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw Error();
  process.env.APP_ORIGIN = origin.origin;
} catch { reject('Set the exact HTTPS site origin.'); }
process.env.ALLOW_LOCAL_HTTP_AUTH = 'false';
process.env.NODE_ENV = 'production';
// A single staging instance applies committed migrations before accepting traffic.
const migration = spawnSync(process.execPath, [resolve(root, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy', '--schema', resolve(root, 'apps/web/prisma/schema.prisma')], {cwd: root, stdio: 'inherit', env: process.env});
if (migration.error || migration.status !== 0) reject('Database migration failed; the site was not started.');
const child = spawn(process.execPath, [resolve(root, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '0.0.0.0', '--port', process.env.PORT || '3000'], {cwd: resolve(root, 'apps/web'), stdio: 'inherit', env: process.env});
const worker=process.env.RESEND_API_KEY&&process.env.MAIL_FROM?spawn(process.execPath,[resolve(root,'apps/web/scripts/mail-worker.mjs')],{cwd:root,stdio:'inherit',env:process.env}):null;
worker?.on('error',()=>console.error('Email worker unavailable; queued messages are retained.'));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {worker?.kill(signal);child.kill(signal)});
child.on('error', () => reject('The test server could not start.'));
child.on('exit', code => {worker?.kill('SIGTERM');process.exit(code ?? 1)});
