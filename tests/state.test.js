import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, score, completeQuestion, levelComplete, advanceLevel, validateState } from '../js/state.js';
import { levels, solidsFor } from '../js/data/levels.js';

function solve(state, ids) {
  for (const id of ids) { state.attempts[id] = 1; completeQuestion(state, id); }
}
test('fresh state validates with a safe checkpoint and zero score', () => {
  const state = freshState();
  assert.deepEqual(validateState(state), state);
  assert.equal(score(state), 0);
  assert.equal(advanceLevel(state), false);
});
test('questions reward once and keys require the three regional gates', () => {
  const state = freshState();
  assert.equal(completeQuestion(state, 'q7'), false);
  assert.equal(completeQuestion(state, 'q2'), false);
  solve(state, ['q1']);
  assert.equal(completeQuestion(state, 'q1'), false);
  assert.equal(score(state), 10);
  assert.deepEqual(state.keys, []);
  solve(state, ['q2', 'q3']);
  assert.equal(levelComplete(state), true);
  assert.deepEqual(state.keys, [0]);
  assert.equal(score(state), 30);
});
test('bridges appear only after solving their gate and barriers disappear', () => {
  const state = freshState(); const level = levels[0]; const gate = level.gates[0];
  assert.ok(solidsFor(level, state).includes(gate));
  assert.ok(!solidsFor(level, state).includes(gate.bridge));
  solve(state, ['q1']);
  assert.ok(!solidsFor(level, state).includes(gate));
  assert.ok(solidsFor(level, state).includes(gate.bridge));
});
test('three distinct levels assign every question exactly once', () => {
  assert.equal(levels.length, 3);
  assert.equal(new Set(levels.flatMap(l => l.questionIds)).size, 12);
  assert.equal(new Set(levels.map(l => JSON.stringify(l.platforms))).size, 3);
  for (const level of levels) {
    assert.ok(level.gates.every(g => g.y === 0 && g.h === 450));
    assert.ok(level.checkpoints.some(cp => cp.id === 'start'));
    assert.ok(level.exit.x < level.width);
  }
});
test('corrupt, legacy, future, skipped and invalid checkpoint saves are rejected', () => {
  const state = freshState();
  for (const patch of [{ version: 0 }, { contentVersion: 2 }, { level: 3 }, { attempts: [] }, { attempts: { q4: 1 } }, { checkpoint: 'unknown' }, { checkpoint: 'canopy' }, { won: true }, { keys: [0] }, { solved: ['q2'], attempts: { q2: 1 } }, { attempts: { q1: Infinity } }]) {
    assert.equal(validateState({ ...state, ...patch }), null, JSON.stringify(patch));
  }
  assert.equal(validateState({ ...state, solved: ['q1'], attempts: {} }), null);
});
test('checkpoints restore only after required earlier gates', () => {
  const state = freshState(); solve(state, ['q1']); state.checkpoint = 'canopy';
  assert.deepEqual(validateState(state), state);
  const clone = validateState(state); clone.solved.push('q2');
  assert.deepEqual(state.solved, ['q1']);
});
test('solving a terminal immediately saves a safe checkpoint and derived phase', () => {
  const state = freshState();
  solve(state, ['q1']);
  assert.equal(state.checkpoint, 'machine-q1');
  assert.equal(validateState(state).checkpoint, 'machine-q1');
  assert.equal(validateState({ ...freshState(), checkpoint: 'machine-q1' }), null);
  assert.equal(validateState({ ...state, phase: 'treasure' }), null);
  const legacy = { ...state }; delete legacy.phase;
  assert.equal(validateState(legacy).phase, 'journey');
});

test('full journey restores with 120 points and explicit three-key door', () => {
  const state = freshState();
  for (let i = 0; i < 3; i++) {
    solve(state, levels[i].questionIds);
    assert.deepEqual(validateState(state), state);
    assert.equal(advanceLevel(state), true);
  }
  assert.equal(state.won, true);
  assert.equal(score(state), 120);
  assert.deepEqual(state.keys, [0, 1, 2]);
  assert.ok(!solidsFor(levels[2], state).includes(levels[2].keyDoor));
  assert.deepEqual(validateState(state), state);
  assert.ok(solidsFor(levels[2], freshState()).includes(levels[2].keyDoor));
});
