import fs from 'node:fs';
const required=['AGENTS.md','package.json','apps/web/package.json','apps/web/prisma/schema.prisma','apps/mobile/package.json','docker-compose.yml','docs/CODEX_TASKS.md'];
let failed=false;
for(const file of required){const ok=fs.existsSync(file); console.log(`${ok?'OK ':'MISSING'} ${file}`);if(!ok)failed=true;}
for(const file of ['apps/web/.env','apps/mobile/.env']){if(fs.existsSync(file)) console.log(`LOCAL SECRET FILE PRESENT (do not commit): ${file}`)}
process.exitCode=failed?1:0;
