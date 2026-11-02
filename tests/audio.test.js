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
    assert.deepEqual(audio.settings, { muted: true, volume: 1, musicVolume: 1, effectsVolume: 1 });
    audio.setSettings({ volume: NaN, muted: 'invalid' });
    assert.deepEqual(audio.settings, { muted: true, volume: 1, musicVolume: 1, effectsVolume: 1 });
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
    assert.deepEqual(new GameAudio().settings, { muted: true, volume: .7, musicVolume: 1, effectsVolume: 1 });
    assert.equal(map.get('gundul-warrior-v1'), 'learning-progress');
    audio.destroy();
  } finally {
    if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage);
    else delete globalThis.localStorage;
  }
});

test('legacy audio preferences gain independent channels without changing the master or learning save', () => {
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const map = new Map([
    ['gundul-warrior-audio-v1', JSON.stringify({ muted: true, volume: .6 })],
    ['gundul-warrior-v1', 'untouched-progress'],
  ]);
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem: key => map.get(key), setItem: (key, value) => map.set(key, value),
    } });
    const audio = new GameAudio();
    assert.deepEqual(audio.settings, { muted: true, volume: .6, musicVolume: 1, effectsVolume: 1 });
    audio.setSettings({ musicVolume: .2, effectsVolume: .8 });
    assert.deepEqual(new GameAudio().settings, { muted: true, volume: .6, musicVolume: .2, effectsVolume: .8 });
    audio.setSettings({ musicVolume: -2, effectsVolume: 9 });
    assert.equal(audio.settings.musicVolume, 0);
    assert.equal(audio.settings.effectsVolume, 1);
    audio.setSettings({ musicVolume: NaN, effectsVolume: 'loud' });
    assert.equal(audio.settings.musicVolume, 0);
    assert.equal(audio.settings.effectsVolume, 1);
    assert.equal(map.get('gundul-warrior-v1'), 'untouched-progress');
  } finally {
    if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage);
    else delete globalThis.localStorage;
  }
});

test('regional music alternates a second phrase and then returns deterministically', () => {
  for (const theme of ['forest', 'cave', 'castle']) {
    const audio = new GameAudio(); audio.setTheme(theme);
    // Only the platform clock and oscillator output are substituted; schedule is real.
    audio.context = { state: 'running', currentTime: 0 };
    const beat = 60 / { forest: 108, cave: 84, castle: 124 }[theme] / 2;
    const melody = [];
    for (let i = 0; i < 96; i++) {
      let lead = 0;
      audio.tone = (note, time, duration, wave, volume, music) => {
        assert.ok(Number.isFinite(note) && note > 0);
        if (music && Math.abs(duration - beat * .68) < 1e-8) lead = note;
      };
      audio.context.currentTime = i * beat;
      audio.nextNote = audio.context.currentTime + .01;
      audio.schedule();
      melody.push(lead);
    }
    assert.notDeepEqual(melody.slice(0, 32), melody.slice(32, 64), theme);
    assert.deepEqual(melody.slice(0, 32), melody.slice(64, 96), theme);
  }
});
