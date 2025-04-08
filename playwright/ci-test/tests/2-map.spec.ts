import { test, expect } from '@playwright/test';

test.use({
  storageState: 'auth.json'
});

test('test', async ({ page }) => {
  await page.goto('http://dev.local:8000/');
  await expect(page.locator('h1')).toContainText('Africa Rangeland Watch');
  await expect(page.getByRole('link', { name: 'MAP' })).toBeVisible();
  await page.getByRole('link', { name: 'MAP' }).click();
  await expect(page.getByRole('region', { name: 'Map' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Layers' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Analysis' })).toBeVisible();
  await expect(page.getByRole('button', { name: ') Select landscape' })).toBeVisible();
  await page.getByRole('combobox').selectOption('Drakensberg Sub-Escarpment');
  await page.goto('http://dev.local:8000/#/map');
  await page.getByRole('combobox').selectOption('Bahine NP');
  await page.goto('http://dev.local:8000/#/map');
  await page.getByText('Temporal').click();
  await page.getByText('Baseline', { exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Start Date' })).toBeEmpty();
  await expect(page.getByRole('textbox', { name: 'End Date' })).toBeEmpty();
  await page.getByRole('banner').click();
  await expect(page.getByText('Click polygons on the map')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset Form' })).toBeVisible();
  await page.getByRole('button', { name: 'Zoom out' }).click();
  await page.getByRole('button', { name: 'Zoom out' }).click();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByRole('button', { name: 'Reset bearing to north' }).click();
  await page.locator('.BasemapSelector').click();
  await page.locator('.BasemapSelector').click();
  await page.locator('.BasemapSelector').click();
  await expect(page.getByRole('link', { name: 'MapLibre' })).toBeVisible();
  await page.getByLabel('Toggle attribution').click();
  await page.getByLabel('Toggle attribution').click();
  await expect(page.getByRole('link', { name: 'MapLibre' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Upload' })).toBeVisible();
  await expect(page.locator('.css-uylvmb > .chakra-icon')).toBeVisible();
});