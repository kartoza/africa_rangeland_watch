import { test, expect } from '@playwright/test';

test.use({
  storageState: 'auth.json'
});

test('test', async ({ page }) => {
  await page.goto('https://arw.dev.do.kartoza.com/');
  await expect(page.locator('h1')).toContainText('Africa Rangeland Watch');
  await expect(page.locator('a').filter({ hasText: 'DASHBOARD' })).toBeVisible();
  await page.locator('a').filter({ hasText: 'DASHBOARD' }).click();
  await expect(page.getByRole('button', { name: 'Temporal - 1 Settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Test tinashe Download Move' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tinashe Test Public Dashboard' })).toBeVisible();
  await page.getByRole('button', { name: 'Filter' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('#app')).toContainText('3 resources found');
  await page.getByRole('button', { name: 'Filter' }).first().click();
  await page.locator('label').filter({ hasText: 'My Organisations' }).locator('span').first().click();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('#app')).toContainText('0 resources found');
  await page.getByRole('button', { name: 'Filter' }).first().click();
  await page.locator('label').filter({ hasText: 'My Organisations' }).locator('svg').click();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByText('resources found').click();
  await expect(page.getByRole('textbox', { name: 'Search resources...' })).toBeEmpty();
  await expect(page.getByRole('button', { name: 'New' })).toBeVisible();
  await page.getByRole('button', { name: 'New' }).click();
  await expect(page.locator('#app')).toContainText('Analysis Results');
  await expect(page.getByRole('button', { name: 'New Analysis' })).toBeVisible();
  await expect(page.locator('a').filter({ hasText: 'My Dashboard' })).toBeVisible();
  await page.locator('a').filter({ hasText: 'My Dashboard' }).click();
});