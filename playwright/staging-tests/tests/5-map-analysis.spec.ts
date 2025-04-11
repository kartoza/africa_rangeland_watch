import { test, expect } from '@playwright/test';

test.use({
  storageState: 'auth.json'
});

test('test', async ({ page }) => {
  await page.goto('https://arw.dev.do.kartoza.com/');
  await expect(page.locator('h1')).toContainText('Africa Rangeland Watch');
  await expect(page.getByRole('link', { name: 'MAP' })).toBeVisible();
  await page.getByRole('link', { name: 'MAP' }).click();
  await page.getByText('Baseline', { exact: true }).click();
  await page.getByRole('combobox').selectOption('Drakensberg Sub-Escarpment');
  await page.getByText('Temporal').click();
  await page.getByText('Monthly').click();
  await page.getByRole('region', { name: ') Select variable' }).getByRole('combobox').selectOption('Bare ground');
  await page.locator('div').filter({ hasText: /^Select a month123456789101112$/ }).getByRole('combobox').selectOption('2');
  await page.getByRole('button', { name: ') Select comparison period' }).click();
  await page.getByRole('button', { name: ') Select comparison period' }).click();
  await page.getByRole('button', { name: 'Add more' }).click();
  await page.locator('[id="accordion-panel-\\:r1d\\:"] > div > .chakra-select').first().selectOption('2018');
  await page.locator('[id="accordion-panel-\\:r1d\\:"] > div:nth-child(2) > .chakra-select').selectOption('2');
  await page.getByRole('region', { name: 'Map' }).click({
    position: {
      x: 341,
      y: 427
    }
  });
  await page.getByRole('button', { name: 'Run Analysis' }).click();
  await expect(page.locator('#app')).toContainText('Statistics');
  await page.getByRole('button', { name: 'Run Analysis' }).click();
  await page.getByRole('button', { name: 'Run Analysis' }).click();
  await expect(page.locator('#app')).toContainText('Request failed with status code 400');
});