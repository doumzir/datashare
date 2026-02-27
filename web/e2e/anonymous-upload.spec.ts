import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Scénario 3 — Upload anonyme → Téléchargement avec mot de passe', () => {
  test('should allow anonymous upload and download via link', async ({ page }) => {
    const tmpFile = path.join('/tmp', `anon-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, 'Anonymous upload test');

    await page.goto('/');

    // S'assurer qu'on n'est pas connecté
    await expect(page.getByText('Connexion')).toBeVisible();

    // Upload sans authentification
    await page.locator('input[type="file"]').setInputFiles(tmpFile);
    await page.click('button[type="submit"]');

    await expect(page.getByText('Fichier envoyé !')).toBeVisible();
    const shareLink = await page.locator('.font-mono').textContent();
    expect(shareLink).toContain('/download/');

    // Vérifier le téléchargement
    await page.goto(shareLink!);
    await expect(page.getByText('Télécharger')).toBeVisible();
    await expect(page.getByText(path.basename(tmpFile))).toBeVisible();

    fs.unlinkSync(tmpFile);
  });

  test('should require password for protected file', async ({ page }) => {
    const tmpFile = path.join('/tmp', `pwd-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, 'Password protected content');

    await page.goto('/');

    await page.locator('input[type="file"]').setInputFiles(tmpFile);
    await page.locator('input[type="password"]').fill('secret123');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Fichier envoyé !')).toBeVisible();
    const shareLink = await page.locator('.font-mono').textContent();

    // Aller sur le lien de téléchargement
    await page.goto(shareLink!);
    await expect(page.getByText('protégé par un mot de passe')).toBeVisible();

    // Mauvais mot de passe
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByText('Vérifier').click();
    await expect(page.getByText('Mot de passe incorrect')).toBeVisible();

    // Bon mot de passe
    await page.locator('input[type="password"]').fill('secret123');
    await page.getByText('Vérifier').click();
    await expect(page.getByText('Télécharger')).toBeVisible();

    fs.unlinkSync(tmpFile);
  });
});
