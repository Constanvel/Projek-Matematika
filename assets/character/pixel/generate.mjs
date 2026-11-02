// Run from the project root: node assets/character/pixel/generate.mjs
// Rebuilds authored sprite-sheet documentation; the renderer itself needs no image load.
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = fileURLToPath(new URL('./', import.meta.url));
const server = createServer(async (req, res) => {
  try {
    if (req.url === '/') { res.setHeader('Content-Type', 'text/html'); res.end('<canvas id="sheet" width="192" height="336"></canvas>'); return; }
    if (req.url !== '/js/game/pixel-character.js') { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', 'text/javascript');
    res.end(await readFile(path.join(root, req.url.slice(1))));
  } catch { res.writeHead(500).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 700 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const manifest = await page.evaluate(async () => {
    const { drawPixelCharacter, CHARACTER_ANIMATIONS, CHARACTER_PALETTE } = await import('/js/game/pixel-character.js');
    const canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
    const animations = {};
    Object.entries(CHARACTER_ANIMATIONS).forEach(([state, info], row) => {
      animations[state] = { ...info, row, frames: info.frames, anchor: [16, 47] };
      for (let frame = 0; frame < info.frames; frame++) drawPixelCharacter(ctx, { x: frame * 32 + 16, y: row * 48 + 47, height: 46, state, frame });
    });
    return { image: canvas.toDataURL('image/png'), schema_version: 1, authoring: 'Original procedural pixel art. No resampling of original assets.', identity: 'Gundul: bald head, warm skin, black armour, silver brooch, oxblood cape, boots.', cell: [32, 48], sheet: [192, 336], palette: CHARACTER_PALETTE, animations };
  });
  const { image, ...metadata } = manifest;
  await writeFile(path.join(output, 'gundul-sheet.png'), Buffer.from(image.split(',')[1], 'base64'));
  await writeFile(path.join(output, 'manifest.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  console.log('Generated assets/character/pixel/gundul-sheet.png and manifest.json');
} finally { await browser?.close(); server.close(); }
