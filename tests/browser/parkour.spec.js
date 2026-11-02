import { test, expect } from '@playwright/test';
import { freshState, completeQuestion } from '../../js/state.js';
import { levels } from '../../js/data/levels.js';

test('mandatory parkour requires jumping and falling restores checkpoint without losing learning', async ({ page }) => {
  const state = freshState(); state.attempts.q1 = 1; completeQuestion(state, 'q1');
  state.checkpoint = levels[0].parkour[0].checkpointId;
  await page.goto('/');
  await page.evaluate(state => localStorage.setItem('gundul-warrior-v1', JSON.stringify(state)), state);
  await page.reload(); await page.locator('#continue').click();
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#board')).toBeFocused();
  await page.screenshot({ path: 'test-results/mandatory-parkour.png', fullPage: true });
  await page.keyboard.down('KeyD');
  await page.evaluate(() => new Promise((resolve, reject) => {
    const start = performance.now();
    let falling = false;
    function tick() {
      const board = document.getElementById('board');
      const y = Number(board.dataset.playerY);
      if (y > 500) falling = true;
      if (falling && y === 380) { resolve(); return; }
      if (performance.now() - start > 10000) { reject(new Error('Tidak mendeteksi jatuh dan respawn')); return; }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }));
  await page.keyboard.up('KeyD');
  await expect(page.locator('#interaction')).toContainText('Kembali ke checkpoint');
  await expect(page.locator('#score')).toHaveText('10');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gundul-warrior-v1')));
  expect(saved.solved).toEqual(['q1']); expect(saved.checkpoint).toBe(state.checkpoint);
  expect(Number(await page.locator('#board').getAttribute('data-player-x'))).toBeLessThan(levels[0].parkour[0].gap.start);
  await page.reload(); await page.locator('#continue').click();
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#score')).toHaveText('10');
});
