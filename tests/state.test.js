import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, score, completeQuestion, walkable, validateState, levelQuestions } from '../js/state.js';
import { map, gateIndex } from '../js/data/levels.js';
test('fresh state validates and walls block movement', () => {
  const state = freshState(); assert.ok(validateState(state));
  assert.equal(walkable(state, 0, 0), false);
  assert.equal(walkable(state, -1, 1), false);
  assert.equal(walkable(state, 2, 1), true);
  assert.equal(gateIndex(''), -1);
});
test('gate opens only after its question and rewards cannot duplicate', () => {
  const state = freshState(); assert.equal(walkable(state, 4, 1), false);
  completeQuestion(state, 'q1'); completeQuestion(state, 'q1');
  assert.equal(score(state), 10); assert.equal(walkable(state, 4, 1), true);
});
test('all gates are required along the route to the treasure', () => {
  for (let count = 0; count <= 3; count++) {
    const state = freshState(); state.solved = levelQuestions(0).slice(0,count).map(q => q.id);
    const queue = [[1,1]]; const seen = new Set(['1,1']); let reached = false;
    while (queue.length) {
      const [x,y] = queue.shift(); if (map[y][x] === 'T') reached = true;
      for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx=x+dx, ny=y+dy, key=`${nx},${ny}`;
        if (!seen.has(key) && walkable(state,nx,ny)) { seen.add(key); queue.push([nx,ny]); }
      }
    }
    assert.equal(reached, count === 3);
  }
});
test('rejects corrupt or prematurely unlocked saves', () => {
  assert.equal(validateState(null), null);
  assert.equal(validateState({...freshState(),level:2}), null);
  assert.equal(validateState({...freshState(),solved:['unknown']}), null);
  assert.equal(validateState({...freshState(),won:true}), null);
  assert.equal(validateState({...freshState(),keys:[0]}), null);
  assert.deepEqual(validateState({...freshState(),position:{x:0,y:0}}).position,{x:1,y:1});
});
test('full legitimate progress restores with 120 points', () => {
  const state = freshState();
  for (let level=0; level<4; level++) {
    state.level=level;
    for (const q of levelQuestions(level)) { state.attempts[q.id]=1; completeQuestion(state,q.id); }
    if(level<3) state.keys.push(level);
  }
  state.won=true; assert.ok(validateState(state)); assert.equal(score(state),120);
});
