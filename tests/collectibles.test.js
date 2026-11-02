import test from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../js/data/levels.js';
import { freshState, collectItem, score, validateState } from '../js/state.js';
import { GameEngine } from '../js/game/engine.js';

test('v1 saves without collectibles restore learning progress unchanged', () => {
  const original = freshState();
  delete original.collected;
  const restored = validateState(original);
  assert.deepEqual(restored.collected, []);
  assert.equal(restored.checkpoint, 'start');
  assert.deepEqual(restored.solved, []);
});

test('collectibles reward once and never change math score or keys', () => {
  const state = freshState();
  const coin = levels[0].collectibles.find(item => item.x < levels[0].gates[0].x && !item.requiresQuestion);
  assert.ok(coin);
  assert.equal(collectItem(state, coin.id), true);
  assert.equal(collectItem(state, coin.id), false);
  assert.equal(score(state), 0);
  assert.deepEqual(state.keys, []);
  assert.deepEqual(validateState(state), state);
  assert.equal(collectItem(state, 'unknown'), false);
});

test('invalid, duplicate, future and gate-skipping collectible saves are rejected', () => {
  const state = freshState();
  const first = levels[0].collectibles[0].id;
  const behindGate = levels[0].collectibles.find(item => item.x > levels[0].gates[0].x);
  assert.ok(behindGate);
  for (const collected of [null, ['unknown'], [first, first], [levels[1].collectibles[0].id], [behindGate.id]]) {
    assert.equal(validateState({ ...state, collected }), null);
  }
});

test('engine collects by proximity once, respects pause and retains collection after falling', () => {
  const state = freshState();
  const coin = levels[0].collectibles.find(item => item.x < levels[0].gates[0].x && !item.requiresQuestion);
  let calls = 0;
  const engine = new GameEngine({ canvas: { getContext: () => ({}) }, level: levels[0], getProgress: () => state,
    onCollect: item => { calls++; collectItem(state, item.id); } });
  engine.player.x = coin.x;
  engine.player.y = coin.y - 35;
  engine.detectCollectibles(state);
  engine.detectCollectibles(state);
  assert.equal(calls, 1);
  engine.player.y = 1000;
  engine.update();
  assert.ok(state.collected.includes(coin.id));
  assert.equal(score(state), 0);
});
