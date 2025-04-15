import { test, expect } from '@playwright/test';

test.use({
  storageState: 'auth.json'
});

test('test', async ({ page }) => {
  await page.goto('https://arw.dev.do.kartoza.com/');
  await expect(page.locator('h1')).toContainText('Africa Rangeland Watch');
  await expect(page.getByRole('link', { name: 'MAP' })).toBeVisible();
  await page.getByRole('link', { name: 'MAP' }).click();
  await expect(page.getByRole('region', { name: 'Map' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Header Logo' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'MAP', exact: true })).toBeVisible();
  await expect(page.locator('a').filter({ hasText: 'DASHBOARD' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'HELP' })).toBeVisible();
  await expect(page.getByText('ABOUT')).toBeVisible();
  await expect(page.getByText('RESOURCES')).toBeVisible();
  await expect(page.locator('a:nth-child(3)')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Upload' })).toBeVisible();
  await expect(page.locator('g path').first()).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Layers' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Analysis' })).toBeVisible();
  await page.getByRole('button').filter({ hasText: /^$/ }).first().click();
  await page.getByRole('button').filter({ hasText: /^$/ }).first().click();
  await expect(page.getByRole('button', { name: ') Select landscape' })).toBeVisible();
  await expect(page.getByRole('combobox')).toBeVisible();
  await page.getByRole('combobox').selectOption('Bahine NP');
  await expect(page.getByRole('button', { name: ') Select analysis type' })).toBeVisible();
  await expect(page.locator('label').filter({ hasText: 'Baseline' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset Form' })).toBeVisible();
  await expect(page.getByText('Click polygons on the map')).toBeVisible();
  await page.getByRole('button', { name: 'Zoom out' }).click();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.getByRole('link', { name: 'MapLibre' })).toBeVisible();
  await page.getByLabel('Toggle attribution').click();
  await page.getByLabel('Toggle attribution').click();
  await expect(page.getByRole('link', { name: 'MapLibre' })).toBeVisible();
  await page.getByRole('tab', { name: 'Analysis' }).click();
  await page.getByRole('tab', { name: 'Layers' }).click();
  await expect(page.getByRole('button', { name: 'Baseline (Average)' })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Soil carbon 1984-2019$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Near-real time' })).toBeVisible();
  await expect(page.getByText('Average for past 30 days')).toBeVisible();
  await page.getByRole('combobox').selectOption('9');
  await page.locator('label').filter({ hasText: /^NDVI$/ }).locator('span').first().click();
  await page.getByRole('button', { name: 'Zoom out' }).click();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.locator('label').filter({ hasText: /^Bare ground$/ }).locator('span').first().click();
  await page.locator('label').filter({ hasText: /^NDVI$/ }).locator('div').click();
  await page.locator('label').filter({ hasText: /^Bare ground$/ }).locator('span').first().click();
  await page.locator('label').filter({ hasText: /^EVI$/ }).locator('span').first().click();
  await page.getByRole('region', { name: 'Map' }).click({
    position: {
      x: 441,
      y: 258
    }
  });
});