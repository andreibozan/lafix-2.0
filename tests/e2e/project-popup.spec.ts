import {test,expect} from '@playwright/test';
test('project popup supports category selection, back navigation and Escape',async({page})=>{
 await page.goto('/');
 const trigger=page.getByRole('button',{name:'Începe proiectul tău'});
 await trigger.click();
 const popup=page.getByRole('dialog');
 await expect(popup).toBeVisible();
 await popup.getByRole('radio',{name:'Panouri solare',exact:false}).check();
 await popup.getByRole('button',{name:'Continuă cu proiectul meu'}).click();
 await expect(popup.getByLabel('Serviciu',{exact:true})).toHaveValue('Panouri solare');
 await popup.getByLabel('Localitate',{exact:true}).fill('Deva');
 await popup.getByRole('button',{name:'Înapoi la servicii'}).click();
 await popup.getByRole('button',{name:'Continuă cu proiectul meu'}).click();
 await expect(popup.getByLabel('Localitate',{exact:true})).toHaveValue('Deva');
 await page.keyboard.press('Escape');
 await expect(popup).not.toBeVisible();
 await expect(trigger).toBeFocused();
});
test('popup remains usable on a narrow mobile viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await page.getByRole('button',{name:'Începe proiectul tău'}).click();
 const popup=page.getByRole('dialog');await expect(popup).toBeVisible();
 const box=await popup.boundingBox();expect(box).not.toBeNull();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.width).toBeLessThanOrEqual(390);
 await popup.getByRole('button',{name:'Închide fereastra Proiectul tău'}).click();await expect(popup).not.toBeVisible();
});

test('popup opens at 15 seconds and does not reopen after dismissal',async({page})=>{
 await page.clock.install();
 await page.goto('/');
 const popup=page.getByRole('dialog');
 // Synchronize the virtual clock to document navigation, independent of hydration.
 const elapsed=await page.evaluate(()=>performance.now());
 await page.clock.runFor(Math.max(0,14_999-elapsed));
 await expect(popup).not.toBeVisible();
 await page.clock.runFor(1);
 await expect(popup).toBeVisible();
 await page.keyboard.press('Escape');
 await page.clock.runFor(60_000);
 await expect(popup).not.toBeVisible();
});
test('opening manually cancels the pending automatic popup',async({page})=>{
 await page.clock.install();await page.goto('/');
 await page.getByRole('button',{name:'Începe proiectul tău'}).click();
 await page.keyboard.press('Escape');
 await page.clock.runFor(15_000);
 await expect(page.getByRole('dialog')).not.toBeVisible();
});
