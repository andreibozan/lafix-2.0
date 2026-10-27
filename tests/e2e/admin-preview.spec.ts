import {test,expect} from '@playwright/test';
test('public admin demo has fictional data, working filters and disabled mutations',async({page})=>{
 await page.goto('/demo/admin');await expect(page.getByRole('status')).toContainText('Acestea sunt date fictive');
 await expect(page.getByRole('button',{name:'Găsește prestatori'}).first()).toBeDisabled();
 await page.getByRole('navigation',{name:'Secțiuni administrare'}).getByRole('button',{name:'Prestatori',exact:false}).click();await expect(page.getByText('Atelier demonstrativ A',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Aprobă',exact:true}).first()).toBeDisabled();
 await page.getByLabel('Caută',{exact:true}).fill('inexistent');await page.getByRole('button',{name:'Caută',exact:true}).click();await expect(page.getByText('Nu există înregistrări pentru filtrele selectate.')).toBeVisible();
});
test('provider experience is reachable from the original front page',async({page})=>{
 await page.goto('/');await page.getByRole('link',{name:'Sunt prestator',exact:false}).click();await expect(page).toHaveURL(/prestatori/);
 await expect(page.getByRole('heading',{name:'Priceperea ta. Următorul proiect.'})).toBeVisible();
});
