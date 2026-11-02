import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAssets } from '../js/game/assets.js';

test('runtime preloads local pixel atlas, not original high-resolution poses', async () => {
  const OriginalImage = globalThis.Image;
  try {
    globalThis.Image = class {
      naturalWidth = 192; naturalHeight = 336;
      set src(value) { assert.match(value, /character\/pixel\/gundul-sheet\.png$/); queueMicrotask(() => this.onload()); }
    };
    const result = await loadAssets();
    assert.ok(result.pixelAtlas);
  } finally { if (OriginalImage === undefined) delete globalThis.Image; else globalThis.Image = OriginalImage; }
});

test('missing and corrupt pixel atlas report recoverable errors', async () => {
  const OriginalImage = globalThis.Image;
  try {
    globalThis.Image = class { set src(_) { queueMicrotask(() => this.onerror()); } };
    await assert.rejects(loadAssets(), /Gagal memuat atlas pixel Gundul/);
    globalThis.Image = class {
      naturalWidth = 0; naturalHeight = 0;
      set src(_) { queueMicrotask(() => this.onload()); }
    };
    await assert.rejects(loadAssets(), /kosong atau rusak/);
  } finally { if (OriginalImage === undefined) delete globalThis.Image; else globalThis.Image = OriginalImage; }
});
