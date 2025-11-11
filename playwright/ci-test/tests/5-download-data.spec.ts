import { test, expect } from '@playwright/test';

let url = '/';

test.use({
  storageState: 'auth.json'
});

test.describe('download files', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto(url);
  });

  test('test download geojson', async ({ page }) => {
    await expect(page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New')).toBeVisible();
    await page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New').click();
    await page.getByRole('link', { name: 'MAP' }).click();

    await page.locator('.css-uylvmb > .chakra-icon').click();

    await page.locator('div:nth-child(2) > .chakra-card__body > .css-1l7wene > .chakra-checkbox > .chakra-checkbox__control').click();

    await page.getByRole('button', { name: 'Download' }).click();

    const downloadPromise = page.waitForEvent('download');

    await page.getByRole('combobox').selectOption('geojson');

    await page.getByLabel('Download Selected Datasets').getByRole('button', { name: 'Download' }).click();

    const download = await downloadPromise;

    await download.saveAs('tests/data/output/' + download.suggestedFilename());

  });

  test('test download shapefile', async ({ page }) => {
    await expect(page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New')).toBeVisible();
    await page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New').click();
    await page.getByRole('link', { name: 'MAP' }).click();

    await page.locator('.css-uylvmb > .chakra-icon').click();

    await page.locator('div:nth-child(2) > .chakra-card__body > .css-1l7wene > .chakra-checkbox > .chakra-checkbox__control').click();

    await page.getByRole('button', { name: 'Download' }).click();

    const downloadPromise = page.waitForEvent('download');

    await page.getByRole('combobox').selectOption('shapefile');

    await page.getByLabel('Download Selected Datasets').getByRole('button', { name: 'Download' }).click();

    const download = await downloadPromise;

    await download.saveAs('tests/data/output/' + download.suggestedFilename());

  });

  test('test download geopackage', async ({ page }) => {
    await expect(page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New')).toBeVisible();
    await page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New').click();
    await page.getByRole('link', { name: 'MAP' }).click();

    await page.locator('.css-uylvmb > .chakra-icon').click();

    await page.locator('div:nth-child(2) > .chakra-card__body > .css-1l7wene > .chakra-checkbox > .chakra-checkbox__control').click();

    await page.getByRole('button', { name: 'Download' }).click();

    const downloadPromise = page.waitForEvent('download');

    await page.getByRole('combobox').selectOption('geopackage');

    await page.getByLabel('Download Selected Datasets').getByRole('button', { name: 'Download' }).click();

    const download = await downloadPromise;

    await download.saveAs('tests/data/output/' + download.suggestedFilename());

  });

  test('test download kml', async ({ page }) => {
    await expect(page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New')).toBeVisible();
    await page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New').click();
    await page.getByRole('link', { name: 'MAP' }).click();

    await page.locator('.css-uylvmb > .chakra-icon').click();

    await page.locator('div:nth-child(2) > .chakra-card__body > .css-1l7wene > .chakra-checkbox > .chakra-checkbox__control').click();

    await page.getByRole('button', { name: 'Download' }).click();

    const downloadPromise = page.waitForEvent('download');

    await page.getByRole('combobox').selectOption('kml');

    await page.getByLabel('Download Selected Datasets').getByRole('button', { name: 'Download' }).click();

    const download = await downloadPromise;

    await download.saveAs('tests/data/output/' + download.suggestedFilename());

  });

});