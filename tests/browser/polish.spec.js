import { test, expect } from '@playwright/test';

async function launch(page) {
  await page.goto('/');
  await page.locator('#start').click();
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#board')).toBeFocused();
}

test('fullscreen viewport, settings persistence, pause and touch movement are functional', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#fullscreen')).toBeVisible();
  await expect(page.locator('#menu-world')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
  await page.screenshot({ path: 'test-results/fullscreen-menu.png', fullPage: true });
  await page.locator('#settings').click();
  await page.getByLabel('Bisukan musik dan efek suara').check();
  await page.locator('#audio-volume').fill('0.6');
  await page.getByRole('button', { name: 'Simpan & tutup' }).click();
  const preferences = await page.evaluate(() => JSON.parse(localStorage.getItem('gundul-warrior-audio-v1')));
  expect(preferences).toEqual({ muted: true, volume: .6, musicVolume: 1, effectsVolume: 1 });
  await launch(page);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
  await page.screenshot({ path: 'test-results/fullscreen-forest.png', fullPage: true });
  await page.locator('#game-settings').click();
  const x = await page.locator('#board').getAttribute('data-player-x');
  await page.keyboard.down('KeyD'); await page.waitForTimeout(150); await page.keyboard.up('KeyD');
  expect(await page.locator('#board').getAttribute('data-player-x')).toBe(x);
  await page.getByRole('button', { name: 'Simpan & lanjutkan' }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#board')).toHaveAttribute('data-paused', 'true');
  await page.getByRole('button', { name: 'Lanjut bermain' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  const startX = Number(await page.locator('#board').getAttribute('data-player-x'));
  await page.locator('[data-control="right"]').dispatchEvent('pointerdown', { pointerId: 31, button: 0, bubbles: true });
  await page.locator('[data-control="jump"]').dispatchEvent('pointerdown', { pointerId: 32, button: 0, bubbles: true });
  await expect.poll(async () => Number(await page.locator('#board').getAttribute('data-player-x'))).toBeGreaterThan(startX + 20);
  expect(Number(await page.locator('#board').getAttribute('data-player-y'))).toBeLessThan(380);
  await page.locator('[data-control="right"]').dispatchEvent('pointerup', { pointerId: 31, bubbles: true });
  await page.locator('[data-control="jump"]').dispatchEvent('pointerup', { pointerId: 32, bubbles: true });
  await page.screenshot({ path: 'test-results/fullscreen-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('math dialog remains readable on portrait and screenshot coverage includes victory', async ({ page }) => {
  const { freshState, completeQuestion, advanceLevel } = await import('../../js/state.js');
  const { levels } = await import('../../js/data/levels.js');
  const state = freshState();
  state.attempts.q1 = 1; completeQuestion(state, 'q1');
  await page.addInitScript(state => localStorage.setItem('gundul-warrior-v1', JSON.stringify(state)), state);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/'); await page.locator('#continue').click();
  await expect(page.locator('#loading')).toBeHidden();
  await page.keyboard.press('KeyE');
  await expect(page.locator('#modal')).toBeVisible();
  await page.screenshot({ path: 'test-results/fullscreen-mobile-question.png', fullPage: true });
  expect(await page.locator('#modal').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'Kembali menjelajah' }).click();
  for (const level of levels) {
    for (const id of level.questionIds) { state.attempts[id] = 1; completeQuestion(state, id); }
    advanceLevel(state);
  }
  await page.evaluate(state => localStorage.setItem('gundul-warrior-v1', JSON.stringify(state)), state);
  // Remove init script by navigating in a fresh page so the completed save isn't replaced.
  const finalPage = await page.context().newPage();
  await finalPage.goto('/');
  await finalPage.locator('#continue').click();
  await expect(finalPage.locator('#victory')).toBeVisible();
  await finalPage.screenshot({ path: 'test-results/fullscreen-victory.png', fullPage: true });
});
