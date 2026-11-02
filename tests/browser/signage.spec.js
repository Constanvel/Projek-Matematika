import { test, expect } from '@playwright/test';
import { freshState, completeQuestion, advanceLevel } from '../../js/state.js';
import { levels } from '../../js/data/levels.js';

// Saved checkpoints are fixture setup only. Full keyboard traversal remains in game.spec.js.
test('parkour signs and checkpoint clusters stay readable across all regions', async ({ page }) => {
  test.setTimeout(120000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const state = freshState();
  // Apply fixture after navigation: the outgoing live engine may save on unload.
  await page.addInitScript(() => {
    const fixture = sessionStorage.getItem('signage-fixture');
    if (fixture) localStorage.setItem('gundul-warrior-v1', fixture);
  });
  await page.goto('/');
  for (const level of levels) {
    for (const route of level.parkour) {
      for (const id of level.questionIds.slice(0, level.questionIds.indexOf(route.requiresQuestion) + 1)) {
        if (!state.solved.includes(id)) { state.attempts[id] = 1; completeQuestion(state, id); }
      }
      state.checkpoint = route.checkpointId;
      await page.evaluate(state => sessionStorage.setItem('signage-fixture', JSON.stringify(state)), state);
      await page.reload(); await page.locator('#continue').click();
      await expect(page.locator('#loading')).toBeHidden();
      await expect(page.locator('#board')).toHaveAttribute('data-player-x', String(route.start));
      const geometry = await page.evaluate(async ({ levelId, routeId }) => {
        const { levels } = await import('/js/data/levels.js');
        const { planWorldLabels, visibleWorldPanels, overlaps, LABEL_GAP } = await import('/js/game/world-labels.js');
        const level = levels.find(l => l.id === levelId), route = level.parkour.find(r => r.id === routeId);
        const layout = planWorldLabels(level);
        const panels = visibleWorldPanels(layout, { camera: Math.max(0, route.start + 17 - 960 * .4), player: { x: route.start, y: 380, w: 34, h: 70 }, checkpoint: route.checkpointId });
        return { hasHint: panels.some(p => p.kind === 'sign' && p.item.x === route.start), collision: panels.some((p, i) => panels.slice(i + 1).some(q => overlaps(p.bounds, q.bounds, LABEL_GAP))), flags: layout.flags.filter(f => Math.abs(f.x - route.start) < 150).length };
      }, { levelId: level.id, routeId: route.id });
      expect(geometry).toEqual({ hasHint: true, collision: false, flags: 1 });
      // Metadata keeps contextual help; the renderer no longer draws floating blocks.
      await expect(page.locator('#interaction')).toContainText(route.hint);
      await page.screenshot({ path: `test-results/signage-${route.id}.png`, fullPage: true });
      if (level.id === 'castle' && route === level.parkour.at(-1)) {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: 'test-results/signage-portrait.png', fullPage: true });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
    }
    for (const id of level.questionIds) {
      if (!state.solved.includes(id)) { state.attempts[id] = 1; completeQuestion(state, id); }
    }
    advanceLevel(state);
  }
  expect(errors).toEqual([]);
});
