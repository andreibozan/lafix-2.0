import {test,expect} from '@playwright/test';
import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';
const {hash} = bcrypt;
import {randomUUID} from 'node:crypto';
test('customer → admin approval and matching → provider offer → customer acceptance',async({page,request})=>{
 test.skip(!process.env.DATABASE_URL,'Requires dedicated PostgreSQL');
 expect(process.env.DATABASE_URL).toMatch(/lafix_test(?:\?|$)/);
 const db=new PrismaClient(),suffix=randomUUID(),password='Synthetic-test-password-123!';
 const ids:string[]=[];let requestId:string|undefined;
 const email=(role:string)=>`${role}-${suffix}@example.invalid`;
 async function login(role:string){await page.goto('/account');await page.getByLabel('Email').fill(email(role));await page.getByLabel('Parolă').fill(password);await page.getByRole('button',{name:'Intră în cont'}).click();await expect(page).toHaveURL(role==='admin'?/admin/:/dashboard/);}
 try{
 const admin=await db.user.create({data:{name:'Admin sintetic',email:email('admin'),role:'ADMIN',passwordHash:await hash(password,12)}});ids.push(admin.id);
 for(const role of ['CLIENT','PROVIDER']){const response=await request.post('/api/auth/register',{data:{role,name:'Test sintetic',email:email(role),password,...(role==='PROVIDER'?{businessName:`Firma ${suffix}`,phone:'0700000000',categories:['Renovări'],counties:['Hunedoara']}:{})}});expect(response.status()).toBe(201);ids.push((await response.json()).user.id);}
 await login('CLIENT');await page.goto('/');await page.getByLabel('Serviciu').selectOption('Renovări');await page.getByLabel('Județ').fill('Hunedoara');await page.getByLabel('Localitate').fill('Deva');await page.getByLabel('Descrierea lucrării').fill(`Lucrare sintetică ${suffix}`);await page.getByLabel('Nume',{exact:true}).fill('Client sintetic');await page.getByLabel('Telefon').fill('0700000000');await page.getByLabel('Email',{exact:true}).fill(email('CLIENT'));await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Trimite solicitarea →'}).click();await expect(page.getByRole('status')).toContainText('Cererea a fost înregistrată');
 requestId=(await db.serviceRequest.findFirstOrThrow({where:{clientId:ids[1]}})).id;
 await login('admin');await page.goto('/admin');await page.getByRole('navigation',{name:'Secțiuni administrare'}).getByRole('button',{name:'Prestatori',exact:false}).click();const provider=page.locator('article').filter({hasText:`Firma ${suffix}`});await provider.getByRole('button',{name:'Aprobă',exact:true}).click();await expect(provider).toContainText('Aprobat');await page.getByRole('navigation',{name:'Secțiuni administrare'}).getByRole('button',{name:'Solicitări',exact:false}).click();const lead=page.locator('article').filter({hasText:'Renovări'});await lead.getByText('Califică oportunitatea',{exact:true}).click();for(const name of ['Am confirmat contactul clientului.','Am confirmat intenția actuală de a solicita oferte.','Serviciul, localitatea și detaliile sunt suficiente.'])await lead.getByRole('checkbox',{name}).check();await lead.getByLabel('Notă de verificare').fill('Confirmare sintetică pentru verificarea fluxului.');await lead.getByRole('button',{name:'Califică oportunitatea'}).click();await expect(lead).toContainText('Calificată');await page.locator('article').filter({hasText:'Renovări'}).getByRole('button',{name:'Găsește prestatori'}).click();await expect(page.locator('article').filter({hasText:'Renovări'})).toContainText('Alocată');
 await login('PROVIDER');await page.getByRole('link',{name:/Portofel/}).click();await page.getByRole('button',{name:/Adaugă.*de test/}).click();await expect(page.getByRole('status')).toContainText('Operațiune demonstrativă finalizată');await page.getByRole('link',{name:'← Oportunitățile mele'}).click();await page.getByRole('button',{name:'Vezi costul și deblochează →'}).click();await page.getByRole('button',{name:/Confirmă deblocarea demo/}).click();await expect(page.getByRole('status')).toContainText('Oportunitate deblocată');await page.getByLabel('Preț estimat (lei)').fill('250');await page.getByLabel('Detalii ofertă').fill('Ofertă sintetică pentru renovare');await page.getByRole('button',{name:'Trimite ofertă'}).click();await expect(page.getByRole('status')).toContainText('Ofertă trimisă');
 await login('CLIENT');await page.getByRole('button',{name:'Acceptă oferta'}).click();await expect(page.locator('article')).toContainText('ACCEPTED');expect(await db.offer.count({where:{requestId,status:'ACCEPTED'}})).toBe(1);
 }finally{
 if(requestId){await db.offer.deleteMany({where:{requestId}});await db.requestMatch.deleteMany({where:{requestId}});await db.serviceRequest.deleteMany({where:{id:requestId}});}
 await db.auditEvent.deleteMany({where:{actorId:{in:ids}}});await db.providerProfile.deleteMany({where:{userId:{in:ids}}});await db.user.deleteMany({where:{id:{in:ids}}});await db.$disconnect();
 }
});
