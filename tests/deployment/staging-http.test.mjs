import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {resolve} from 'node:path';

test('built staging middleware blocks pages, API and assets and fails closed without a password', async () => {
  for (const configured of [true, false]) {
    const portProbe = createServer().listen(0, '127.0.0.1');
    await once(portProbe, 'listening');
    const port = portProbe.address().port;
    await new Promise(resolve => portProbe.close(resolve));
    const password = randomBytes(32).toString('hex');
    const child = spawn(process.execPath, [resolve('node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
      cwd: resolve('apps/web'),
      env: {...process.env, NODE_ENV: 'production', DEPLOYMENT_STAGE: 'staging', STAGING_ACCESS_PASSWORD: configured ? password : '', DATABASE_URL: '', AUTH_SECRET: '', APP_ORIGIN: ''},
      stdio: 'ignore',
    });
    let started = false;
    const base = `http://127.0.0.1:${port}`;
    try {
      for (let attempt = 0; attempt < 100; attempt++) {
        if (child.exitCode !== null) throw Error('Test server exited before readiness');
        try { await fetch(base); started = true; break; } catch { await delay(100); }
      }
      assert.ok(started, 'Test server must start');
      for (const path of ['/', '/admin', '/api/auth/status', '/illustrations/lafix-original-houses.svg']) {
        const response = await fetch(base + path);
        assert.equal(response.status, configured ? 401 : 503, path);
        assert.match(response.headers.get('x-robots-tag'), /noindex/);
        assert.match(response.headers.get('cache-control'), /no-store/);
      }
      if (configured) {
        const response = await fetch(base, {headers: {authorization: `Basic ${Buffer.from(`preview:${password}`).toString('base64')}`}});
        assert.equal(response.status, 200);
        assert.match(await response.text(), /Planuri mari/);
      }
      const health = await fetch(base + '/api/health');
      assert.equal(health.status, 503, 'No DB configured; health remains accessible and reports unavailable');
      assert.deepEqual(await health.json(), {status: 'unavailable'});
    } finally {
      if (child.exitCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); }
    }
  }
});
