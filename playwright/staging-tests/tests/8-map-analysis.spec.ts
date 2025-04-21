import { test, expect } from '@playwright/test';

test.use({
  storageState: 'auth.json'
});

test('test', async ({ page }) => {
  await page.goto('https://arw.dev.do.kartoza.com/');
  await expect(page.locator('h1')).toContainText('Africa Rangeland Watch');
  await expect(page.getByRole('link', { name: 'MAP' })).toBeVisible();
  await page.getByRole('link', { name: 'MAP' }).click();
  await page.getByRole('combobox').selectOption('Zambia');
  await page.getByRole('combobox').selectOption('UCPP');
  await page.getByText('Temporal').click();
  await page.getByText('Annual').click();
  await page.getByRole('region', { name: ') Select variable' }).getByRole('combobox').selectOption('NDVI');
  await page.getByRole('region', { name: 'Map' }).click({
    position: {
      x: 394,
      y: 325
    }
  });
  await page.getByRole('region', { name: ') Select landscape' }).getByRole('combobox').selectOption('Soutpansberg');
  await page.getByRole('region', { name: 'Map' }).click({
    position: {
      x: 555,
      y: 393
    }
  });
  await page.getByRole('button', { name: 'Run Analysis' }).click();
  await expect(page.locator('#app')).toContainText('Statistics');
  await expect(page.getByRole('cell', { name: 'Year' })).toBeVisible();
  await page.getByRole('cell', { name: 'Area' }).click();
  await page.getByRole('cell', { name: 'Min' }).click();
});