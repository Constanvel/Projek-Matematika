import test from 'node:test';
import assert from 'node:assert/strict';
import { load, save, KEY } from '../js/storage.js';
import { freshState } from '../js/state.js';

test('new storage namespace preserves legacy progress and round-trips current state', () => {
  const memory = new Map([['function-adventure-v1', '{"legacy":true}']]);
  globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
  try {
    assert.equal(KEY, 'gundul-warrior-v1');
    assert.equal(load().state, null);
    const state = freshState(); assert.equal(save(state), true);
    assert.deepEqual(load().state, state);
    assert.equal(memory.get('function-adventure-v1'), '{"legacy":true}');
    memory.set(KEY, 'not json');
    assert.equal(load().state, null); assert.ok(load().warning);
    memory.set(KEY, JSON.stringify({ ...state, attempts: [] }));
    assert.equal(load().state, null);
  } finally { delete globalThis.localStorage; }
});
test('unavailable storage never throws', () => {
  globalThis.localStorage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  try { assert.equal(save(freshState()), false); assert.equal(load().state, null); assert.ok(load().warning); }
  finally { delete globalThis.localStorage; }
});
