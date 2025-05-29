// Commenting out this test since I always got error on my Playwright when recording test
// VM1628:332 Uncaught TypeError: Cannot read properties of null (reading 'selector')
//     at RecordActionTool.onInput (eval at extend (0.0.0.0/:6169:40), <anonymous>:332:37)
//     at Recorder._onInput (eval at extend (0.0.0.0/:6169:40), <anonymous>:1087:67)
//     at HTMLDocument.eval (eval at extend (0.0.0.0/:6169:40), <anonymous>:893:64)
//     at async <anonymous>:339:30

// import { test, expect } from '@playwright/test';

// let url = '/';

// test.use({
//   storageState: 'auth.json'
// });

// test('test', async ({ page }) => {
//   await page.goto(url);
//   await expect(page.locator('h1')).toContainText('Africa Rangeland Watch');
//   await page.getByRole('link', { name: 'MAP' }).click();
//   await page.getByRole('tab', { name: 'Layers' }).click();
//   await page.getByRole('region', { name: 'Map' }).click({
//     button: 'middle',
//     position: {
//       x: 359,
//       y: 425
//     }
//   });
//   await page.getByRole('combobox').selectOption('1');
//   await page.getByRole('region', { name: 'Map' }).click({
//     position: {
//       x: 637,
//       y: 180
//     }
//   });
//   await page.locator('.css-17xejub').click({
//     button: 'right'
//   });
//   await page.getByRole('tab', { name: 'Layers' }).click();
//   await page.getByRole('tab', { name: 'Analysis' }).click();
//   await page.getByRole('combobox').selectOption('Bahine NP');
//   await page.getByText('Spatial').click();
//   await expect(page.getByRole('button', { name: ') Select variable' })).toBeVisible();
//   await page.getByRole('region', { name: ') Select variable' }).getByRole('combobox').selectOption('EVI');
//   await page.getByLabel(') Select year range (Optional)').locator('div').filter({ hasText: 'Select start' }).getByRole('combobox').selectOption('2017');
//   await page.getByRole('region', { name: ') Select year range (Optional)' }).click();
//   await page.getByLabel(') Select year range (Optional)').locator('div').filter({ hasText: 'Select end' }).getByRole('combobox').selectOption('2019');
//   await page.getByRole('button', { name: 'Draw' }).click();
//   await page.getByRole('region', { name: 'Map' }).click({
//     position: {
//       x: 621,
//       y: 198
//     }
//   });
//   await page.getByRole('button', { name: 'Polygon tool (p)' }).click();
//   await page.getByRole('button', { name: 'Polygon tool (p)' }).click();
//   await page.getByRole('region', { name: 'Map' }).click({
//     position: {
//       x: 804,
//       y: 388
//     }
//   });
//   await page.getByRole('button', { name: 'Polygon tool (p)' }).click();
//   await page.getByRole('region', { name: 'Map' }).click({
//     button: 'right',
//     position: {
//       x: 468,
//       y: 239
//     }
//   });
//   await page.getByRole('button', { name: 'Polygon tool (p)' }).click();
//   await page.getByRole('button', { name: 'Polygon tool (p)' }).click();
//   await page.getByRole('region', { name: 'Map' }).click({
//     position: {
//       x: 781,
//       y: 403
//     }
//   });
//   await page.getByRole('button', { name: 'Polygon tool (p)' }).click();
//   await page.getByRole('region', { name: 'Map' }).click({
//     position: {
//       x: 724,
//       y: 445
//     }
//   });
//   await page.getByRole('button', { name: 'Finish Drawing' }).click();
//   await page.getByRole('button', { name: 'Draw' }).click();
//   await page.getByRole('button', { name: 'Polygon tool (p)' }).click();
//   await page.getByRole('region', { name: 'Map' }).click({
//     position: {
//       x: 639,
//       y: 328
//     }
//   });
//   await page.getByRole('button', { name: 'Polygon tool (p)' }).click();
//   await page.getByRole('region', { name: 'Map' }).click({
//     position: {
//       x: 941,
//       y: 537
//     }
//   });
// });