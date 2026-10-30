import {test} from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),config=require('../apps/mobile/app.config.js');
test('store builds reject missing or test backend and isolate preview identifiers',()=>{
 const original={...process.env};try{
 process.env.EAS_BUILD_PROFILE='production';process.env.APP_VARIANT='production';delete process.env.EXPO_PUBLIC_API_URL;assert.throws(config,/API_URL/);
 process.env.EXPO_PUBLIC_API_URL='https://lafix-staging-web.onrender.com';assert.throws(config,/test backend/);
 process.env.EXPO_PUBLIC_API_URL='https://example.invalid';delete process.env.EXPO_PUBLIC_EAS_PROJECT_ID;assert.throws(config,/Expo account/);
 process.env.EXPO_PUBLIC_EAS_PROJECT_ID='synthetic-project-id';assert.equal(config().android.package,'ro.lafix.app');
 process.env.APP_VARIANT='preview';assert.equal(config().ios.bundleIdentifier,'ro.lafix.app.preview');
 }finally{for(const k of Object.keys(process.env))if(!(k in original))delete process.env[k];Object.assign(process.env,original)}
});
