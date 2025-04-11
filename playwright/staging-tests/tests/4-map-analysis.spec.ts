import { test, expect } from '@playwright/test';

test.use({
  storageState: 'auth.json'
});

test('test', async ({ page }) => {
  await page.goto('https://arw.dev.do.kartoza.com/');
  await expect(page.locator('h1')).toContainText('Africa Rangeland Watch');
  await expect(page.getByRole('link', { name: 'MAP' })).toBeVisible();
  await page.getByRole('link', { name: 'MAP' }).click();
  await page.getByRole('region', { name: 'Map' }).click({
    position: {
      x: 493,
      y: 300
    }
  });
  await page.getByRole('button', { name: 'Run Analysis' }).click();
  await expect(page.locator('#app')).toContainText('Statistics');
  await expect(page.getByRole('button', { name: 'Save Results' })).toBeVisible();
  await page.getByRole('button', { name: 'Save Results' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.locator('label').filter({ hasText: 'Temporal' }).locator('span').first().click();
  await expect(page.locator('label').filter({ hasText: 'Temporal' })).toBeVisible();
  await expect(page.locator('label').filter({ hasText: 'Annual' })).toBeVisible();
  await page.getByRole('region', { name: ') Select reference period' }).getByRole('combobox').selectOption('2016');
  await page.getByRole('combobox').nth(3).selectOption('2018');
  await page.getByRole('button', { name: 'Run Analysis' }).click();
  await expect(page.locator('#app')).toContainText('Statistics');
  await expect(page.locator('canvas').nth(1)).toBeVisible();
  await expect(page.locator('canvas').nth(2)).toBeVisible();
  await expect(page.locator('#app')).toMatchAriaSnapshot(`- paragraph: Statistics`);
  await page.locator('canvas').nth(1).click({
    position: {
      x: 139,
      y: 121
    }
  });
  await page.locator('canvas').nth(2).click({
    position: {
      x: 205,
      y: 40
    }
  });
  await page.locator('canvas').nth(2).click({
    position: {
      x: 187,
      y: 12
    }
  });
  await page.locator('canvas').nth(2).click({
    position: {
      x: 183,
      y: 31
    }
  });
  await page.locator('canvas').nth(2).click({
    position: {
      x: 208,
      y: 37
    }
  });
  await page.locator('canvas').nth(2).click({
    position: {
      x: 206,
      y: 12
    }
  });
  await page.locator('canvas').nth(2).click({
    position: {
      x: 186,
      y: 12
    }
  });
  await page.getByRole('cell', { name: 'Bahine National Park' }).click();
  await page.getByRole('cell', { name: 'BNP western polygon' }).click();
  await page.getByRole('button', { name: 'Save Results' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByText('Spatial').click();
  await page.getByRole('button', { name: 'Draw' }).click();
  await page.getByRole('button', { name: 'Polygon tool (p)' }).click();
  await page.getByRole('button', { name: 'Polygon tool (p)' }).click();
  await page.getByRole('button', { name: 'Polygon tool (p)' }).click();
  await page.getByRole('button', { name: 'Polygon tool (p)' }).click();
  await page.getByRole('button', { name: 'Polygon tool (p)' }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('link', { name: 'Profile Area' }).click();
  await page.locator('a').filter({ hasText: 'Analysis Results' }).click();
  await expect(page.locator('#app')).toContainText('Temporal Analysis of Bahine NP');
  await expect(page.locator('#app')).toContainText('Baseline Analysis of Bahine NP');
  await page.getByRole('button', { name: 'View' }).first().click();
  await expect(page.getByText('View AnalysisInfoLocationLinked ResourcesRaster OutputTitleValueOwnerjeff@')).toBeVisible();
  await expect(page.locator('canvas').first()).toBeVisible();
  await expect(page.locator('canvas').nth(1)).toBeVisible();
  await page.getByRole('button').filter({ hasText: /^$/ }).click();
  await page.getByRole('button', { name: 'View' }).nth(1).click();
  await expect(page.locator('.css-16vx7aj')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'EVI' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '0.25274563282355295' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'NDVI' })).toBeVisible();
  await expect(page.locator('#app')).toContainText('0.44281920874453096');
  await page.getByRole('tab', { name: 'Location' }).click();
  await page.getByRole('button').filter({ hasText: /^$/ }).click();
  await page.getByRole('button', { name: 'Delete' }).first().click();
  await page.getByText('Yes, Delete').nth(1).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Yes, Delete' }).click();
  await page.locator('a').filter({ hasText: 'My Dashboard' }).click();
});