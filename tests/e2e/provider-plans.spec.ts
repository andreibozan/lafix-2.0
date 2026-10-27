import {test,expect} from '@playwright/test';
test('commercial preview explains separate Pro pricing and confirms a fictitious unlock',async({page})=>{
 await page.goto('/prestatori');await expect(page.getByRole('heading',{name:'Priceperea ta. Următorul proiect.'})).toBeVisible();
 await expect(page.getByText('Oportunitățile se plătesc separat.',{exact:false}).first()).toBeVisible();
 await page.getByRole('button',{name:'Simulează deblocarea ↗'}).click();
 await expect(page.getByRole('region',{name:'Confirmare simulare'})).toContainText('Nu se transferă bani reali');
 await page.getByRole('button',{name:'Confirmă simularea de 20 lei'}).click();
 await expect(page.getByText('Sold simulat: 80 lei · o singură deblocare')).toBeVisible();
 await expect(page.getByText('synthetic@example.invalid · 0700000000')).toBeVisible();
 await page.getByRole('button',{name:'Resetează exemplul'}).click();
 await expect(page.getByText('synthetic@example.invalid · 0700000000')).not.toBeVisible();
});
