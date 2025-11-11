import { test, expect } from '@playwright/test';

let url = '/';

test.use({
  storageState: 'auth.json'
});

test.describe('upload files', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto(url);
  });

  test('test geojson', async ({ page }) => {
    await expect(page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New')).toBeVisible();
    await page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New').click();

    await page.getByRole('link', { name: 'MAP' }).click();

    await page.getByRole('button', { name: 'Upload' }).click();

    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.getByText('Select File').click();

    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles('tests/data/test_data_geo.geojson');

    await page.getByText('Status: success').click();

    await page.getByRole('button', { name: 'Clear' }).click();

    await page.getByText('UploadAdd DataSupported file').click();

    await page.locator('.css-uylvmb > .chakra-icon').click();

    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: 'test_data_geo.geojson' })).toBeVisible();
  });

  test('test gpkg', async ({ page }) => {
    await expect(page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New')).toBeVisible();
    await page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New').click();
    await page.getByRole('link', { name: 'MAP' }).click();
    await expect(page.getByRole('button', { name: 'Upload' })).toBeVisible();
    await page.getByRole('button', { name: 'Upload' }).click();
    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.getByText('Select File').click();

    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles('tests/data/test_data.gpkg');

    await page.getByText('Status: success').click();
    await page.getByRole('button', { name: 'Clear' }).click();
    await page.locator('.css-uylvmb > .chakra-icon').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'test_data.gpkg' })).toBeVisible();
  });

  test('test kml', async ({ page }) => {
    await expect(page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New')).toBeVisible();
    await page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New').click();
    await page.getByRole('link', { name: 'MAP' }).click();
    await page.getByRole('button', { name: 'Upload' }).click();
    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.getByText('Select File').click();

    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles('tests/data/test_data_kml.kml');
    await page.getByRole('button', { name: 'Clear' }).click();
    await page.locator('.css-uylvmb > .chakra-icon').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'test_data_kml.kml' })).toBeVisible();
  });

  test('test zip', async ({ page }) => {
    await expect(page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New')).toBeVisible();
    await page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New').click();
    await expect(page.getByRole('link', { name: 'MAP' })).toBeVisible();
    await page.getByRole('link', { name: 'MAP' }).click();
    await expect(page.getByRole('button', { name: 'Upload' })).toBeVisible();
    await page.getByRole('button', { name: 'Upload' }).click();
    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.getByText('Select File').click();

    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles('tests/data/limpopo_test.zip');
    await page.locator('.css-uylvmb > .chakra-icon').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'limpopo_test.zip' })).toBeVisible();
  });

});