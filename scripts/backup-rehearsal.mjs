// Never run against live customer data. CI restores into a separate disposable DB.
import {PrismaClient} from '@prisma/client';
import {seal,unseal} from '../apps/web/lib/account-crypto.mjs';
const verify=process.argv.includes('--verify'),url=verify?process.env.RESTORE_CHECK_DATABASE_URL:process.env.DATABASE_URL;
if(!url||new URL(url).pathname!==(verify?'/lafix_restore_check':'/lafix_test'))throw Error('Requires the dedicated synthetic rehearsal database');
const db=new PrismaClient({datasourceUrl:url});
const id='backup-rehearsal-synthetic-user',requestId='backup-rehearsal-synthetic-request';
try{
 if(process.argv.includes('--prepare')){
  await db.user.create({data:{id,email:'backup-rehearsal@example.invalid',name:'Synthetic restore fixture',role:'CLIENT',passwordHash:'disabled-synthetic-account',emailVerifiedAt:new Date(),mfaSecret:seal('SYNTHETIC-ENCRYPTION-RESTORE-FIXTURE','mfa')}});
  await db.serviceRequest.create({data:{id:requestId,clientId:id,contactName:'Synthetic fixture',contactEmail:'backup-rehearsal@example.invalid',contactPhone:'0700000000',category:'Curățenie',county:'Hunedoara',locality:'Deva',description:'Synthetic restore rehearsal fixture only.'}});
 }else if(verify){
  const user=await db.user.findUniqueOrThrow({where:{id}}),request=await db.serviceRequest.findUniqueOrThrow({where:{id:requestId}});
  if(request.clientId!==user.id||unseal(user.mfaSecret,'mfa')!=='SYNTHETIC-ENCRYPTION-RESTORE-FIXTURE')throw Error('Restored relationships or encrypted secrets do not match');
  const migrations=await db.$queryRaw`SELECT count(*)::int AS count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`;
  if(migrations[0].count<4)throw Error('Restored schema migration history is incomplete');
  console.log('Restore rehearsal passed: schema, user, linked request and encrypted secret.');
 }else if(process.argv.includes('--cleanup')){await db.serviceRequest.deleteMany({where:{id:requestId}});await db.user.deleteMany({where:{id}})}else throw Error('Specify --prepare, --verify or --cleanup');
}finally{await db.$disconnect()}
