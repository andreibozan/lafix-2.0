import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {stagingAccess} from '../apps/web/lib/staging-access.mjs';

test('staging gate fails closed and accepts only the preview credentials', async () => {
  const env = {DEPLOYMENT_STAGE: 'staging', STAGING_ACCESS_PASSWORD: 'synthetic-preview-password-123'};
  assert.equal(await stagingAccess(null, {}), 'disabled');
  assert.equal(await stagingAccess(null, {DEPLOYMENT_STAGE: 'staging'}), 'unconfigured');
  for (const value of [null, 'Basic invalid!', 'Bearer test', `Basic ${btoa('wrong:synthetic-preview-password-123')}`, `Basic ${btoa('preview:wrong')}`]) {
    assert.equal(await stagingAccess(value, env), 'denied');
  }
  assert.equal(await stagingAccess(`Basic ${btoa('preview:synthetic-preview-password-123')}`, env), 'allowed');
});

test('staging launcher refuses production databases and enabled billing before connecting', () => {
  const base = {PATH: process.env.PATH, DEPLOYMENT_STAGE: 'staging', BILLING_MODE: 'disabled', AUTH_SECRET: 'synthetic-auth-secret-more-than-32-characters', STAGING_ACCESS_PASSWORD: 'synthetic-preview-password-123', APP_ORIGIN: 'https://preview.example.invalid', DATABASE_URL: 'postgresql://synthetic:synthetic@127.0.0.1:1/lafix_production'};
  for (const [changes, message] of [[{}, /lafix_staging/], [{BILLING_MODE: 'sandbox'}, /billing must remain disabled/], [{DATABASE_URL: 'postgresql://synthetic:synthetic@127.0.0.1:1/lafix_staging', APP_ORIGIN: 'http://example.invalid'}, /HTTPS/]]) {
    const result = spawnSync(process.execPath, ['scripts/start-staging.mjs'], {encoding: 'utf8', env: {...base, ...changes}});
    assert.equal(result.status, 1);
    assert.match(result.stderr, message);
  }
});
