import { test, expect } from '@playwright/test';

test('regional surfaces render distinct cues and clean pit depth', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { levels } = await import('/js/data/levels.js');
    const { createRenderer } = await import('/js/game/renderer.js');
    const { createPlayer } = await import('/js/game/physics.js');
    document.getElementById('home').hidden = true;
    const gallery = document.createElement('div');
    gallery.id = 'surface-gallery'; gallery.style = 'position:fixed;inset:0;z-index:50;overflow:auto;background:#090f1b;display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px';
    document.body.append(gallery);
    const samples = [];
    for (const [index, theme] of ['forest', 'cave', 'castle'].entries()) {
      const surface = ['spring', 'ice', 'crumble'][index];
      for (const state of surface === 'crumble' ? ['intact', 'cracking', 'gone'] : ['intact']) {
        const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 540; gallery.append(canvas);
        const platform = { x: 400, y: 370, w: 150, h: 24, kind: 'ledge', surface };
        const level = { ...levels[index], id: `${theme}-${state}`, width: 960, platforms: [{ x: 0, y: 450, w: 260, h: 90, kind: 'ground' }, platform], signs: [], gates: [], checkpoints: [], collectibles: [], exit: null, keyDoor: null };
        const ctx = canvas.getContext('2d');
        createRenderer({}).draw({ canvas, ctx, level, camera: 0, time: 1, progress: {}, player: { ...createPlayer({ x: 80, y: 380 }), grounded: true }, surfaceStates: [{ platform, state, remaining: .35 }] });
        const data = ctx.getImageData(0, 496, 960, 44).data;
        let blackDots = 0;
        for (let i = 0; i < data.length; i += 4) if (data[i] === 23 && data[i + 1] === 28 && data[i + 2] === 44) blackDots++;
        const pit = ctx.getImageData(600, 500, 350, 40).data;
        const colors = new Set();
        for (let i = 0; i < pit.length; i += 4) colors.add(`${pit[i]},${pit[i + 1]},${pit[i + 2]}`);
        samples.push({ theme, state, blackDots, depthColors: colors.size });
      }
    }
    return samples;
  });
  const signPixels = await page.evaluate(async () => {
    const { levels } = await import('/js/data/levels.js');
    const { createRenderer } = await import('/js/game/renderer.js');
    const { createPlayer } = await import('/js/game/physics.js');
    const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 540;
    const ctx = canvas.getContext('2d');
    const level = { ...levels[0], checkpoints: [], collectibles: [], gates: [], exit: null };
    const frame = { canvas, ctx, level, camera: 0, time: 0, progress: {}, player: createPlayer({ x: 80, y: 380 }) };
    createRenderer({}).draw(frame);
    const withSigns = ctx.getImageData(0, 0, 960, 540).data.slice();
    createRenderer({}).draw({ ...frame, level: { ...level, signs: [] } });
    const withoutSigns = ctx.getImageData(0, 0, 960, 540).data;
    return withSigns.every((value, index) => value === withoutSigns[index]);
  });
  expect(signPixels, 'sign metadata must not draw floating question blocks').toBe(true);
  expect(result).toHaveLength(5);
  expect(result.every(sample => sample.blackDots === 0)).toBe(true);
  expect(result.every(sample => sample.depthColors >= 3)).toBe(true);
  await page.screenshot({ path: 'test-results/regional-surface-gallery.png', fullPage: true });
});
