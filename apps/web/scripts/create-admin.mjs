import {PrismaClient} from '@prisma/client';
import {hash} from 'bcryptjs';
import {createInterface} from 'node:readline/promises';
import {Writable} from 'node:stream';
import {stdin,stdout} from 'node:process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const env=fileURLToPath(new URL('../.env',import.meta.url));if(existsSync(env))process.loadEnvFile(env);
let muted=false;
const output=new Writable({write(chunk,encoding,done){if(!muted)stdout.write(chunk,encoding);done()}});
const rl=createInterface({input:stdin,output,terminal:!!stdin.isTTY});const db=new PrismaClient();
try{
 if(!process.env.DATABASE_URL)throw Error('Configurează DATABASE_URL în apps/web/.env înainte de crearea administratorului.');
 const email=(await rl.question('Email admin: ')).trim().toLowerCase(),name=(await rl.question('Nume admin: ')).trim();
 stdout.write('Parolă admin (min 12 caractere, nu se afișează): ');muted=true;const password=await rl.question('');muted=false;stdout.write('\n');
 if(!/^\S+@\S+\.\S+$/.test(email)||name.length<2||password.length<12||new TextEncoder().encode(password).length>72)throw Error('Date invalide: parola trebuie să aibă minimum 12 caractere și maximum 72 octeți UTF-8.');
 if(await db.user.findUnique({where:{email}}))throw Error('Există deja un cont cu acest email. Nu se promovează automat.');
 const passwordHash=await hash(password,12);
 await db.$transaction(async tx=>{const user=await tx.user.create({data:{email,name,passwordHash,role:'ADMIN'}});await tx.auditEvent.create({data:{actorId:user.id,action:'ADMIN_BOOTSTRAP',resourceId:user.id}})});
 stdout.write('Cont administrator creat. Acces: /admin/login. Activează MFA înainte de producție.\n');
}catch(e){muted=false;console.error(e.message);process.exitCode=1}finally{rl.close();await db.$disconnect()}
