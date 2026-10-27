import {existsSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
const target=new URL('../apps/web/.env',import.meta.url);
if(existsSync(target)){console.log('apps/web/.env există deja; nu a fost modificat. Configurează-l local, fără a publica secrete.');process.exit(0)}
const url=process.env.DATABASE_URL;
if(!url){console.error('Lipsește DATABASE_URL. Furnizează-l printr-un fișier privat sau prin mediul terminalului, nu în argumente CLI și nu în chat. Niciun fișier nu a fost scris.');process.exit(1)}
const parsed=new URL(url);if(!['postgres:','postgresql:'].includes(parsed.protocol))throw Error('Este necesară o conexiune PostgreSQL.');
writeFileSync(target,`DATABASE_URL=${JSON.stringify(url)}\nAUTH_SECRET=${JSON.stringify(randomBytes(48).toString('hex'))}\nAPP_ORIGIN=http://127.0.0.1:3000\nALLOW_LOCAL_HTTP_AUTH=true\nBILLING_MODE=disabled\n`,{mode:0o600,flag:'wx'});
console.log('apps/web/.env a fost creat pentru autentificare HTTP exclusiv pe loopback. Secretul nu este afișat. Rulează migrarea și apoi admin:create.');
