import { test, expect } from '@playwright/test';

let url = '/';

test.use({
  storageState: 'auth.json'
});

test('test', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('h1')).toContainText('Africa Rangeland Watch');
  await expect(page.locator('div').filter({ hasText: 'Africa Rangeland WatchUnderstand and monitor the impact of sustainable' }).nth(2)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Header Logo' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'MAP' })).toBeVisible();
  await expect(page.locator('a').filter({ hasText: 'DASHBOARD' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'HELP' })).toBeVisible();
  await expect(page.getByText('ABOUT', { exact: true })).toBeVisible();
  await expect(page.getByRole('paragraph').filter({ hasText: 'RESOURCES' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Learn More' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Map' })).toBeVisible();
  await page.getByRole('button', { name: 'Resize Section' }).click();
  await page.getByRole('button', { name: 'Resize Section' }).click();
  await expect(page.getByRole('img', { name: 'Footer Logo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'HELP' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ABOUT US' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'RESOURCES' })).toBeVisible();
});