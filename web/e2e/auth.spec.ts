import { test, expect } from '@playwright/test';

const unique = () => `test_${Date.now()}@datashare.com`;

test.describe('Scénario 1 — Inscription → Connexion → Dashboard', () => {
  test('should register, login and reach dashboard', async ({ page }) => {
    const email = unique();

    // Inscription
    await page.goto('/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Redirigé vers dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Envoyer un fichier')).toBeVisible();

    // Déconnexion
    await page.getByText('Déconnexion').click();
    await expect(page).toHaveURL('/login');

    // Reconnexion
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should reject login with wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'nobody@datashare.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.text-red-600')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('should reject duplicate email registration', async ({ page }) => {
    const email = unique();

    await page.goto('/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Disconnect and try to register again with same email
    await page.goto('/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.locator('.text-red-600')).toBeVisible();
  });
});
