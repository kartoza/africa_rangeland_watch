import { test, expect } from '@playwright/test';

test.use({
  storageState: 'auth.json'
});

test('test', async ({ page }) => {
  await page.goto('https://arw.dev.do.kartoza.com/');
  await expect(page.locator('h1')).toContainText('Africa Rangeland Watch');
  await expect(page.getByRole('link', { name: 'MAP' })).toBeVisible();
  await page.getByRole('link', { name: 'MAP' }).click();
  await page.getByRole('region', { name: ') Select landscape' }).getByRole('combobox').selectOption('Limpopo NP');
  await page.getByRole('region', { name: ') Select variable' }).getByRole('combobox').selectOption('EVI');
  await page.getByText('Quarterly').click();
  await page.getByText('Temporal', { exact: true }).click();
  await page.getByRole('region', { name: 'Map' }).click({
    position: {
      x: 378,
      y: 275
    }
  });
  await page.getByRole('region', { name: 'Map' }).click({
    position: {
      x: 367,
      y: 288
    }
  });
  await page.getByRole('button', { name: 'Add more' }).click();
  await page.getByRole('button', { name: 'Delete' }).nth(1).click();
  await page.getByRole('region', { name: ') Select landscape' }).getByRole('combobox').selectOption('Mapungubwe TFCA');
  await page.getByRole('region', { name: 'Map' }).click({
    position: {
      x: 355,
      y: 406
    }
  });
  await page.getByText('BaselineTemporalSpatialBACI').click();
  await page.getByText('Baseline', { exact: true }).click();
  await page.getByRole('combobox').selectOption('Limpopo NP');
  await page.getByRole('textbox', { name: 'Start Date' }).fill('2015-12-31');
  await page.getByRole('textbox', { name: 'End Date' }).fill('2019-06-12');
  await page.locator('label').filter({ hasText: 'Baseline' }).click();
  await page.getByRole('region', { name: 'Map' }).click({
    position: {
      x: 422,
      y: 347
    }
  });
  await page.getByRole('button', { name: 'Run Analysis' }).click();
  await expect(page.locator('#app')).toContainText('Statistics');
  await expect(page.locator('#app')).toContainText('Request failed with status code 502');
});