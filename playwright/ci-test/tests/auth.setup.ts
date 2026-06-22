import { test as setup, expect } from '@playwright/test';

let url = '/';

let user_email = 'admin@example.com';
let password = 'admin';
const authFile = 'auth.json';


setup.describe('login', () => {

  setup('login', async ({page}) => {

    // Go to the base URL
    await page.goto(url);
    // Check if the page has loaded
    await expect(page).toHaveURL(url);
    // Check if the page has the correct title
    await expect(page.locator('h1')).toContainText('Africa Rangeland Watch');
    await expect(page.getByRole('button', { name: 'Learn More' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View Map' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // Click on the Sign In button
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('heading')).toContainText('Welcome Back!');

    // Check if the Sign In form is visible
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeEmpty();
    await page.getByRole('textbox', { name: 'Email' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill(user_email);
    // Enter the password
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill(password);

    // Check if the Sign In button is visible
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    // Check if Google, and GitHub icons are not visible if not configured in the server
    await expect(page.getByRole('link', { name: 'Google Icon' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'GitHub Icon' })).not.toBeVisible();

    // Click on the Sign In button
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.locator('[id="chakra-modal-\\:r4\\:"]').getByText('Start New')).not.toBeVisible();

    // Check if the page has loaded
    await expect(page.locator('h1')).toContainText('Africa Rangeland Watch');
    await expect(page.getByRole('button', { name: 'Learn More' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View Map' })).toBeVisible();
    await page.getByRole('button', { name: 'View Map' }).click();

    // Check if the Sign In button is not visible
    await expect(page.getByRole('button', { name: 'Sign In' })).not.toBeVisible();

    await page.context().storageState({ path: authFile });
    
  });

});
