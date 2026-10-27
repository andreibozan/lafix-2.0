import {PrismaClient} from '@prisma/client';
import {deliverOutbox,mailConfigured} from '../lib/mail-outbox.mjs';
import {setTimeout as delay} from 'node:timers/promises';
const db=new PrismaClient();let running=true;
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{running=false});
if(!mailConfigured()){console.error('Configure encryption, HTTPS origin, email provider and sender first.');process.exit(1)}
try{do{try{await deliverOutbox(db,20)}catch{console.error('Email queue temporarily unavailable.')}if(process.argv.includes('--once'))break;if(running)await delay(30_000)}while(running)}finally{await db.$disconnect()}
