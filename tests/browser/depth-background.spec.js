import { test, expect } from '@playwright/test';

test.setTimeout(90000);

test('all regions have continuous detailed pit scenery across camera positions', async ({ page }) => {
  await page.goto('/');
  const samples = await page.evaluate(async () => {
    const { levels } = await import('/js/data/levels.js');
    const { createRenderer } = await import('/js/game/renderer.js');
    const { createPlayer } = await import('/js/game/physics.js');
    document.getElementById('home').hidden = true;
    const gallery = document.createElement('div');
    gallery.id = 'depth-gallery';
    gallery.style = 'position:absolute;inset:0;z-index:50;background:#090f1b;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;align-content:start';
    document.body.append(gallery);
    const results = [];
    for (const level of levels) {
      for (const camera of [0, 790, 2300, level.width - 960]) {
        const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 540;
        const scene = { ...level, platforms: [], collectibles: [], checkpoints: [], signs: [], gates: [], keyDoor: null, exit: null };
        const ctx = canvas.getContext('2d');
        createRenderer({}).draw({ canvas, ctx, level: scene, camera, time: 0, progress: {}, player: createPlayer({ x: -500, y: 0 }) });
        const bands = [];
        for (const y of [450, 474, 498, 522]) {
          const pixels = ctx.getImageData(0, y, 960, 18).data;
          const colors = new Set();
          for (let i = 0; i < pixels.length; i += 4) colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
          let longest = 0, run = 0, previous = '';
          for (let x = 0; x < 960; x++) {
            const i = x * 4, color = `${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`;
            run = color === previous ? run + 1 : 1; previous = color; longest = Math.max(longest, run);
          }
          bands.push({ y, colors: colors.size, longest });
        }
        results.push({ theme: level.theme, camera, bands });
        if (camera === 790 || camera === level.width - 960) {
          // Show the actual gap with collision terrain too, not only an isolated backdrop.
          createRenderer({}).draw({ canvas, ctx, level, camera, time: 0, progress: { solved: level.questionIds, keys: [0, 1, 2] }, player: createPlayer({ x: camera + 100, y: 380 }) });
          const card = document.createElement('section');
          const title = document.createElement('p'); title.textContent = `${level.name} / kamera ${camera}`; title.style = 'font:14px Arial;color:#eee;margin:4px';
          canvas.style = 'width:100%;height:auto;image-rendering:pixelated'; card.append(title, canvas); gallery.append(card);
        }
      }
    }
    return results;
  });
  await page.screenshot({ path: 'test-results/continuous-depth-gallery.png', fullPage: true });
  for (const sample of samples) {
    for (const band of sample.bands) {
      expect(band.colors, `${sample.theme}@${sample.camera} y${band.y} detail colors`).toBeGreaterThanOrEqual(4);
      expect(band.longest, `${sample.theme}@${sample.camera} y${band.y} flat span`).toBeLessThan(240);
    }
  }
});
