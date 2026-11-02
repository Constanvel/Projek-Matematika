import { test, expect } from '@playwright/test';

test('original medals preserve ranks, names and all leaderboard columns on portrait', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('gundul-warrior-leaderboard-v1', JSON.stringify([
    { name: 'Satu', score: 120, falls: 1, elapsed: 60 },
    { name: 'Dua', score: 110, falls: 2, elapsed: 90 },
    { name: 'Tiga', score: 100, falls: 3, elapsed: 120 },
    { name: 'Empat', score: 90, falls: 4, elapsed: 150 },
  ])));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#leaderboard').click();
  const rows = page.locator('.leaderboard-table tbody tr');
  await expect(rows).toHaveCount(4);
  for (const [index, name] of ['gold', 'silver', 'bronze'].entries()) {
    await expect(rows.nth(index).locator(`svg[data-icon="${name}"]`)).toHaveAttribute('aria-hidden', 'true');
  }
  await expect(rows.nth(3).locator('svg')).toHaveCount(0);
  expect(await rows.first().locator('td').allTextContents()).toEqual(['1', 'Satu', '120', '1', '1:00']);
  expect(await page.locator('.leaderboard-table th').allTextContents()).toEqual(['#', 'Nama', 'Skor', 'Jatuh', 'Waktu']);
  expect(await page.locator('#modal').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/pixel-medals-portrait.png', fullPage: true });
});

test('speaker icon follows the real mute preference and keeps the checkbox label', async ({ page }) => {
  await page.goto('/');
  await page.locator('#settings').click();
  const mute = page.getByLabel('Bisukan musik dan efek suara');
  await expect(page.locator('.settings-row svg[data-icon="speaker"]')).toBeVisible();
  await mute.check();
  await expect(page.locator('.settings-row svg[data-icon="muted"]')).toBeVisible();
  await page.getByRole('button', { name: 'Simpan & tutup' }).click();
  await page.reload();
  await page.locator('#settings').click();
  await expect(mute).toBeChecked();
  await expect(page.locator('.settings-row svg[data-icon="muted"]')).toBeVisible();
  await mute.focus();
  await page.keyboard.press('Space');
  await expect(mute).not.toBeChecked();
  await expect(page.locator('.settings-row svg[data-icon="speaker"]')).toBeVisible();
});
