import { test, expect } from '@playwright/test';

test.use({
  storageState: 'auth.json'
});

test('test', async ({ page }) => {
  await page.goto('https://arw.dev.do.kartoza.com/');
  await expect(page.locator('h1')).toContainText('Africa Rangeland Watch');
  await expect(page.getByRole('link', { name: 'MAP' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Map' })).toBeVisible();
  await page.getByRole('button', { name: 'View Map' }).click();
  await expect(page.getByRole('region', { name: 'Map' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Layers' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Header Logo' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Analysis' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Start Date' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Start Date' }).fill('2018-01-01');
  await page.getByRole('textbox', { name: 'End Date' }).fill('2019-12-31');
  await expect(page.getByText('Click polygons on the map')).toBeVisible();
  await page.waitForLoadState('load');
  await page.getByRole('region', { name: 'Map' }).click({
    position: {
      x: 485,
      y: 259
    }
  });
  await expect(page.getByLabel('Analysis', { exact: true })).toContainText('Click polygons on the map BNP western polygon');
  await expect(page.getByRole('button', { name: 'Run Analysis' })).toBeVisible();
  await page.getByRole('button', { name: 'Run Analysis' }).click();
  await expect(page.getByText('Statistics')).toBeVisible();
  await expect(page.getByText('Statistics')).toBeVisible();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('cell', { name: 'Name' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Bare ground %' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'EVI' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Bahine National Park' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'BNP western polygon' })).toBeVisible();
  await expect(page.locator('tbody')).toContainText('0.2389359742713804');
  await expect(page.locator('tbody')).toContainText('0.05216795436870624');
  await expect(page.getByText('Statistics')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Results' })).toBeVisible();
  await page.getByRole('button', { name: 'Save Results' }).click();
  await expect(page.getByText('Analysis results saved!')).toBeVisible();
  await expect(page.locator('#toast-1-description')).toContainText('You will find your results on the analysis results page in the profile area.');
  await expect(page.getByRole('region', { name: 'Notifications-top-right' }).getByRole('img')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.locator('a:nth-child(3)').click();
  await page.getByRole('link', { name: 'Profile Area' }).click();
  await page.locator('a').filter({ hasText: 'Analysis Results' }).click();
  await expect(page.getByRole('heading', { name: 'Baseline Analysis of Bahine NP' })).toBeVisible();
  await expect(page.locator('#app')).toContainText('Analysis Results');
  await expect(page.getByRole('button', { name: 'View' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete' }).first()).toBeVisible();
  await page.getByRole('heading', { name: 'Baseline Analysis of Bahine NP' }).click();
  await expect(page.getByRole('button', { name: 'Create Dashboard' })).toBeVisible();
  await page.getByRole('button', { name: 'Create Dashboard' }).click();
  await expect(page.locator('[id="chakra-modal--header-\\:r1k\\:"]')).toContainText('Create Dashboard');
  await expect(page.getByText('Dashboard Name')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Dashboard Name' })).toBeEmpty();
  await expect(page.getByText('Chart')).toBeVisible();
  await expect(page.getByText('Map', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Access Level')).toBeVisible();
  await page.getByRole('textbox', { name: 'Dashboard Name' }).click();
  await page.getByRole('textbox', { name: 'Dashboard Name' }).fill('Testing');
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Dashboard Created!')).toBeVisible();
  await expect(page.locator('#toast-2-description')).toContainText('Your dashboard has been created please head over to the dashboard page to view it.');
  await expect(page.getByRole('region', { name: 'Notifications-top-right' }).locator('span path')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.locator('a').filter({ hasText: 'My Dashboard' }).click();
  await expect(page.getByRole('button', { name: 'Testing Settings Download' })).toBeVisible();
  await expect(page.locator('#app')).toContainText('4 resources found');
  await page.getByRole('button', { name: 'Testing Settings Download' }).getByLabel('Delete Dashboard').click();
  await expect(page.getByText('Delete Dashboard')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Yes, Delete' })).toBeVisible();
  await page.getByRole('button', { name: 'Yes, Delete' }).click();
  await expect(page.getByText('Dashboard updated')).toBeVisible();
  await expect(page.locator('#toast-3-description')).toContainText('Action has been completed.If changes dont reflect immediately please refresh the page.');
  await page.getByRole('button', { name: 'Close' }).click();
  await page.locator('div').filter({ hasText: 'Delete DashboardAre you sure' }).nth(3).click();
  await page.locator('a:nth-child(3)').click();
  await page.getByRole('link', { name: 'Profile Area' }).click();
  await page.locator('a').filter({ hasText: 'Analysis Results' }).click();
  await expect(page.getByRole('heading', { name: 'Baseline Analysis of Bahine NP' })).toBeVisible();
  await page.getByRole('heading', { name: 'Baseline Analysis of Bahine NP' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('button', { name: 'Yes, Delete' })).toBeVisible();
  await page.getByRole('button', { name: 'Yes, Delete' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
});