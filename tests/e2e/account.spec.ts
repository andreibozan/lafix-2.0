import {test,expect} from '@playwright/test';
test('Romanian public site and server-enforced admin access',async({page})=>{
 await page.goto('/');await expect(page.locator('html')).toHaveAttribute('lang','ro');
 await page.goto('/admin');await expect(page).toHaveURL(/admin\/login/);await expect(page.getByRole('heading',{name:'Autentificare administrator'})).toBeVisible();
 await page.goto('/account');await expect(page.getByRole('heading',{name:'Autentificare',exact:true})).toBeVisible();
});
test('invalid login reports Romanian error',async({page})=>{
 test.skip(!process.env.DATABASE_URL,'Requires test PostgreSQL');await page.goto('/account');
 await page.getByLabel('Email',{exact:true}).fill('absent@example.invalid');await page.getByLabel('Parolă',{exact:true}).fill('invalid-password');await page.getByRole('button',{name:'Intră în cont',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'Email sau parolă incorecte'})).toContainText('Email sau parolă incorecte');
});
