import { test, expect } from '@playwright/test';

test.use({
  storageState: 'auth.json'
});

test('test', async ({ page }) => {
  await page.goto('http://dev.local:8000/');
  await expect(page.locator('h1')).toContainText('Africa Rangeland Watch');
  await expect(page.locator('a').filter({ hasText: 'DASHBOARD' })).toBeVisible();
  await page.locator('a').filter({ hasText: 'DASHBOARD' }).click();
  await expect(page.locator('#app')).toContainText('0 resources found');
  await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Search resources...' })).toBeEmpty();
  await expect(page.getByRole('button', { name: 'New' })).toBeVisible();
  await expect(page.getByLabel('Layout Settings')).toBeVisible();
  await page.getByText('Filter0 resources foundNewOrganise byLayoutHorizontalVerticalNested').click();
  await page.getByRole('img', { name: 'Footer Logo' }).click();
  await expect(page.getByRole('heading', { name: 'HELP' })).toBeVisible();
  await page.getByText('Filter0 resources foundNewOrganise byLayoutHorizontalVerticalNested').click();
  await page.getByRole('link', { name: 'Visit Support Page' }).click();
  await page.getByText('No data available').click();
  await page.locator('a').filter({ hasText: 'My Dashboard' }).click();
});