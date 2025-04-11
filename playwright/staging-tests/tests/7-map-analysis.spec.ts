import { test, expect } from '@playwright/test';

test.use({
  storageState: 'auth.json'
});

test('test', async ({ page }) => {
  await page.goto('https://arw.dev.do.kartoza.com/');
  await expect(page.locator('h1')).toContainText('Africa Rangeland Watch');
  await expect(page.getByRole('link', { name: 'MAP' })).toBeVisible();
  await page.getByRole('link', { name: 'MAP' }).click();
  await page.getByRole('combobox').selectOption('Mapungubwe TFCA');
  await page.locator('label').filter({ hasText: 'Baseline' }).click();
  await page.getByRole('textbox', { name: 'Start Date' }).fill('2015-12-24');
  await page.getByRole('textbox', { name: 'End Date' }).fill('2019-06-13');
  await page.getByRole('region', { name: 'Map' }).click({
    position: {
      x: 288,
      y: 272
    }
  });
  await page.getByRole('button', { name: 'Run Analysis' }).click();
  await expect(page.locator('#app')).toContainText('Statistics');
  await expect(page.getByRole('cell', { name: 'Botswana' })).toBeVisible();
  await expect(page.locator('tbody')).toContainText('4.489819770595635');
  await page.getByRole('button', { name: 'Save Results' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.locator('a').filter({ hasText: 'UserProfile AreaSign Out' }).click();
  await page.getByRole('link', { name: 'Profile Area' }).click();
  await page.locator('a').filter({ hasText: 'Analysis Results' }).click();
  await expect(page.locator('#app')).toContainText('Baseline Analysis of Mapungubwe TFCA');
  await page.getByRole('button', { name: 'View' }).click();
  await expect(page.locator('.css-16vx7aj')).toBeVisible();
  await page.getByRole('button').filter({ hasText: /^$/ }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Yes, Delete' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
});