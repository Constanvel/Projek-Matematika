import { test, expect } from '@playwright/test';

test('downloaded medals preserve ranks, names and all leaderboard columns on portrait', async ({ page }) => {
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
    const medal = rows.nth(index).locator(`img[data-icon="${name}"]`);
    await expect(medal).toHaveAttribute('aria-hidden', 'true');
    await expect.poll(() => medal.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  }
  await expect(rows.nth(3).locator('[data-icon]')).toHaveCount(0);
  expect(await rows.first().locator('td').allTextContents()).toEqual(['1', 'Satu', '120', '1', '1:00']);
  expect(await page.locator('.leaderboard-table th').allTextContents()).toEqual(['#', 'Nama', 'Skor', 'Jatuh', 'Waktu']);
  expect(await page.locator('#modal').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/pixel-medals-portrait.png', fullPage: true });
});

test('speaker icon follows the real mute preference and keeps the checkbox label', async ({ page }) => {
  await page.goto('/');
  await page.locator('#settings').click();
  const mute = page.getByLabel('Bisukan musik dan efek suara');
  await expect(page.locator('.settings-row img[data-icon="speaker"]')).toBeVisible();
  await mute.check();
  await expect(page.locator('.settings-row img[data-icon="muted"]')).toBeVisible();
  await page.getByRole('button', { name: 'Simpan & tutup' }).click();
  await page.reload();
  await page.locator('#settings').click();
  await expect(mute).toBeChecked();
  await expect(page.locator('.settings-row img[data-icon="muted"]')).toBeVisible();
  await mute.focus();
  await page.keyboard.press('Space');
  await expect(mute).not.toBeChecked();
  await expect(page.locator('.settings-row img[data-icon="speaker"]')).toBeVisible();
});

test('downloaded button icons keep Indonesian actions and the regional guide reachable during play', async ({ page }) => {
  await page.goto('/');
  for (const [id, icon] of [['start', 'play'], ['settings', 'settings'], ['leaderboard', 'leaderboard']]) {
    const image = page.locator(`#${id} img[data-icon="${icon}"]`);
    await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(image).toHaveAttribute('alt', '');
  }
  await page.getByRole('button', { name: 'Mulai petualangan' }).click();
  await expect(page.locator('#loading')).toBeHidden();
  await page.locator('#pause').click();
  const before = await page.locator('#board').getAttribute('data-player-x');
  await page.getByRole('button', { name: 'Cara bermain', exact: true }).click();
  await expect(page.locator('#dialog-content')).toContainText('Akar pegas');
  await expect(page.locator('#dialog-content')).toContainText('Es licin');
  await expect(page.locator('#dialog-content')).toContainText('Batu retak');
  await expect(page.locator('#board')).toHaveAttribute('data-paused', 'true');
  await page.getByRole('button', { name: 'Lanjut bermain', exact: true }).click();
  await expect(page.locator('#board')).toBeFocused();
  expect(await page.locator('#board').getAttribute('data-player-x')).toBe(before);
  await page.keyboard.down('KeyD');
  await expect.poll(async () => Number(await page.locator('#board').getAttribute('data-player-x'))).toBeGreaterThan(Number(before) + 20);
  await page.keyboard.up('KeyD');
});

test('missing decorative icons preserve labels and playable controls', async ({ page }) => {
  await page.route('**/assets/ui/*.png', route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Pengaturan', exact: true }).click();
  await page.getByLabel('Bisukan musik dan efek suara').check();
  await page.getByRole('button', { name: 'Simpan & tutup' }).click();
  await page.getByRole('button', { name: 'Mulai petualangan' }).click();
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#health-status')).toHaveAttribute('aria-label', 'Health 3 dari 3');
  await expect(page.locator('#health')).toHaveText('3/3');
  await page.locator('#game-settings').click();
  await expect(page.getByLabel('Bisukan musik dan efek suara')).toBeChecked();
});
