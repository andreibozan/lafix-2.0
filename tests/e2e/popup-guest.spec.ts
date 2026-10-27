import {test,expect} from '@playwright/test';
import {PrismaClient} from '@prisma/client';
import {randomUUID} from 'node:crypto';
test('a guest can submit from the popup and reopen it from the same project button',async({page})=>{
 test.skip(!process.env.DATABASE_URL,'Requires synthetic PostgreSQL');expect(process.env.DATABASE_URL).toMatch(/lafix_test(?:\?|$)/);
 const db=new PrismaClient(),email=`popup-${randomUUID()}@example.invalid`;let id:string|undefined;
 try{await page.goto('/');const trigger=page.getByRole('button',{name:'Începe proiectul tău',exact:false});await trigger.click();const popup=page.getByRole('dialog');await popup.getByRole('button',{name:'Continuă cu proiectul meu'}).click();await popup.getByLabel('Județ').fill('Hunedoara');await popup.getByLabel('Localitate').fill('Deva');await popup.getByLabel('Descrierea lucrării').fill('Solicitare sintetică din pop-up fără cont.');await popup.getByLabel('Nume',{exact:true}).fill('Vizitator sintetic');await popup.getByLabel('Telefon').fill('0700000000');await popup.getByLabel('Email',{exact:true}).fill(email);await popup.getByRole('checkbox').check();await popup.getByRole('button',{name:'Trimite solicitarea →'}).click();await expect(popup.getByRole('status')).toContainText('Solicitarea a fost trimisă');const record=await db.serviceRequest.findFirstOrThrow({where:{contactEmail:email}});id=record.id;expect(record.clientId).toBeNull();expect(record.requestSource).toBe('POPUP');await page.keyboard.press('Escape');await expect(popup).not.toBeVisible();await trigger.click();await expect(popup).toBeVisible();}
 finally{if(id){await db.auditEvent.deleteMany({where:{resourceId:id}});await db.serviceRequest.deleteMany({where:{id}})}await db.$disconnect()}
});
