import { test, expect } from '@playwright/test';

test.use({
  storageState: 'auth.json'
});

test('test', async ({ page }) => {
  await page.goto('https://arw.dev.do.kartoza.com/');
  await expect(page.locator('h1')).toContainText('Africa Rangeland Watch');
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Header Logo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Learn More' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Map' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resize Section' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Footer Logo' })).toBeVisible();
  await expect(page.locator('a:nth-child(3)')).toBeVisible();
  await expect(page.getByRole('link', { name: 'search' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'MAP' })).toBeVisible();
  await expect(page.locator('a').filter({ hasText: 'DASHBOARD' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'HELP' })).toBeVisible();
  await expect(page.getByText('ABOUT', { exact: true })).toBeVisible();
  await expect(page.getByRole('paragraph').filter({ hasText: 'RESOURCES' })).toBeVisible();
});