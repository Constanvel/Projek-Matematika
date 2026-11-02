import test from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio } from '../js/game/audio.js';

test('audio settings are clamped and tolerate unavailable storage and Web Audio', async () => {
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('denied'); } });
    const audio = new GameAudio();
    assert.equal(audio.settings.volume, .35);
    assert.equal(await audio.start(), false);
    audio.setSettings({ volume: 4, muted: true });
    assert.deepEqual(audio.settings, { muted: true, volume: 1 });
    audio.setSettings({ volume: NaN, muted: 'invalid' });
    assert.deepEqual(audio.settings, { muted: true, volume: 1 });
    audio.setTheme('cave'); assert.equal(audio.theme, 'cave');
    audio.setTheme('castle'); assert.equal(audio.theme, 'castle');
    audio.setPaused(true); audio.play('victory');
    audio.destroy(); audio.destroy();
  } finally {
    if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage);
    else delete globalThis.localStorage;
  }
});

test('audio preferences persist separately from learning progress', () => {
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const map = new Map([['gundul-warrior-v1', 'learning-progress']]);
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem: key => map.get(key), setItem: (key, value) => map.set(key, value),
    } });
    const audio = new GameAudio(); audio.setSettings({ muted: true, volume: .7 });
    assert.deepEqual(new GameAudio().settings, { muted: true, volume: .7 });
    assert.equal(map.get('gundul-warrior-v1'), 'learning-progress');
    audio.destroy();
  } finally {
    if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage);
    else delete globalThis.localStorage;
  }
});
