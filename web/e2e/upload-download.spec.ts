import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const unique = () => `upload_${Date.now()}@datashare.com`;

test.describe('Scénario 2 — Upload authentifié → Téléchargement → Dashboard', () => {
  test('should upload a file and download it via share link', async ({ page }) => {
    const email = unique();

    // Créer un fichier temporaire pour le test
    const tmpFile = path.join('/tmp', `test-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, 'DataShare test file content');

    // Inscription et redirection vers home
    await page.goto('/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Aller sur la page d'accueil pour uploader
    await page.goto('/');

    // Upload du fichier
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(tmpFile);
    await page.click('button[type="submit"]');

    // Vérifier que le lien est affiché
    await expect(page.getByText('Fichier envoyé !')).toBeVisible();
    const shareLink = await page.locator('.font-mono').textContent();
    expect(shareLink).toContain('/download/');

    // Visiter la page de téléchargement
    await page.goto(shareLink!);
    await expect(page.getByText('Télécharger')).toBeVisible();

    // Vérifier que le fichier apparaît dans le dashboard
    await page.goto('/dashboard');
    await expect(page.getByText(path.basename(tmpFile))).toBeVisible();

    // Nettoyage
    fs.unlinkSync(tmpFile);
  });

  test('should show file in dashboard and allow deletion', async ({ page }) => {
    const email = unique();
    const tmpFile = path.join('/tmp', `del-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, 'To be deleted');

    await page.goto('/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/');
    await page.locator('input[type="file"]').setInputFiles(tmpFile);
    await page.click('button[type="submit"]');
    await expect(page.getByText('Fichier envoyé !')).toBeVisible();

    await page.goto('/dashboard');
    const filename = path.basename(tmpFile);
    await expect(page.getByText(filename)).toBeVisible();

    // Suppression avec confirmation
    await page.getByText('Supprimer').click();
    await page.getByText('Confirmer').click();
    await expect(page.getByText(filename)).not.toBeVisible();

    fs.unlinkSync(tmpFile);
  });
});
