import { test, expect } from '@playwright/test';
import { freshState, completeQuestion, advanceLevel, score } from '../../js/state.js';
import { levels } from '../../js/data/levels.js';

test('every parkour checkpoint survives walking falls and reload with learning intact', async ({ page }) => {
  test.setTimeout(180000);
  const state = freshState();
  await page.addInitScript(() => {
    const fixture = sessionStorage.getItem('recovery-fixture');
    if (fixture) localStorage.setItem('gundul-warrior-v1', fixture);
  });
  await page.goto('/');
  for (const level of levels) {
    for (const route of level.parkour) {
      for (const id of level.questionIds.slice(0, level.questionIds.indexOf(route.requiresQuestion) + 1)) {
        if (!state.solved.includes(id)) { state.attempts[id] = 1; completeQuestion(state, id); }
      }
      state.checkpoint = route.checkpointId;
      const souvenir = level.collectibles[0].id;
      if (!state.collected.includes(souvenir)) state.collected.push(souvenir);
      await page.evaluate(state => sessionStorage.setItem('recovery-fixture', JSON.stringify(state)), state);
      await page.reload(); await page.locator('#continue').click();
      await expect(page.locator('#loading')).toBeHidden();
      await page.keyboard.down('KeyD');
      await page.evaluate(() => new Promise((resolve, reject) => {
        let falling = false;
        const start = performance.now();
        function tick() {
          const y = Number(document.getElementById('board').dataset.playerY);
          if (y > 500) falling = true;
          if (falling && y === 380) { resolve(); return; }
          if (performance.now() - start > 8000) { reject(new Error('Tidak mendeteksi jatuh dan respawn')); return; }
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }));
      await page.keyboard.up('KeyD');
      await expect(page.locator('#interaction')).toContainText('Kembali ke checkpoint');
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gundul-warrior-v1')));
      expect(saved.solved).toEqual(state.solved);
      await expect(page.locator('#score')).toHaveText(String(score(state)));
      expect(saved.keys).toEqual(state.keys);
      expect(saved.collected).toEqual(expect.arrayContaining(state.collected));
      expect(saved.checkpoint).toBe(route.checkpointId);
      expect(Number(await page.locator('#board').getAttribute('data-player-x'))).toBeLessThan(route.gap.start);
      // This reload uses the actual saved result, not the setup fixture.
      await page.evaluate(() => sessionStorage.removeItem('recovery-fixture'));
      await page.reload(); await page.locator('#continue').click();
      await expect(page.locator('#loading')).toBeHidden();
      await expect(page.locator('#board')).toHaveAttribute('data-player-x', String(route.start));
    }
    for (const id of level.questionIds) {
      if (!state.solved.includes(id)) { state.attempts[id] = 1; completeQuestion(state, id); }
    }
    advanceLevel(state);
  }
});
