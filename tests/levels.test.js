import test from 'node:test';
import assert from 'node:assert/strict';
import { levels, solidsFor } from '../js/data/levels.js';
import { createPlayer, stepPlayer, FIXED_STEP, PLAYER_WIDTH, PLAYER_HEIGHT } from '../js/game/physics.js';

const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const solvedState = { solved: levels.flatMap(level => level.questionIds), keys: [0, 1, 2] };
const snapshot = [
  { ground: [[0, 830], [980, 870], [2010, 1390]], gates: [760, 1780, 2830], exit: 3190,
    checkpoints: [['start', 80], ['canopy', 1100], ['grove', 2130]] },
  { ground: [[0, 940], [1110, 1060], [2320, 1380]], gates: [870, 2100, 3140], exit: 3490,
    checkpoints: [['start', 80], ['crystal', 1230], ['depths', 2440]] },
  { ground: [[0, 920], [1080, 950], [2190, 3510]], gates: [850, 1960, 2940, 3660, 4320, 5010], exit: 5480,
    checkpoints: [['start', 80], ['tower', 1200], ['hall', 2310], ['treasure', 3140], ['core', 4500]] },
];

test('saved checkpoints, gate positions, exits and original bridge floors remain compatible', () => {
  levels.forEach((level, index) => {
    const original = snapshot[index];
    assert.deepEqual(level.spawn, { x: 80, y: 380 });
    assert.deepEqual(level.platforms.filter(p => p.y === 450).map(p => [p.x, p.w]), original.ground);
    assert.deepEqual(level.gates.map(g => g.x), original.gates);
    assert.deepEqual(level.exit, { x: original.exit, y: 380 });
    assert.deepEqual(level.checkpoints.filter(cp => !cp.id.startsWith('machine-')).map(cp => [cp.id, cp.x]), original.checkpoints);
    for (const checkpoint of level.checkpoints) {
      const body = { ...checkpoint, w: PLAYER_WIDTH, h: PLAYER_HEIGHT };
      assert.equal(checkpoint.y, 380);
      assert.ok(level.platforms.some(p => p.y === body.y + body.h && p.x <= body.x && p.x + p.w >= body.x + body.w), `${level.id}/${checkpoint.id}: full floor support`);
      assert.ok(!level.platforms.some(p => overlaps(body, p)), `${level.id}/${checkpoint.id}: unobstructed spawn`);
    }
    const floors = solidsFor(level, solvedState).filter(p => p.y === 450).sort((a, b) => a.x - b.x);
    let edge = 0;
    for (const floor of floors) { assert.ok(floor.x <= edge); edge = Math.max(edge, floor.x + floor.w); }
    assert.equal(edge, level.width, 'solved bridges preserve a continuous safe lower path');
    for (const obstacle of level.platforms.filter(p => p.kind === 'ground' && p.y < 450)) {
      assert.ok(450 - obstacle.y <= 48, 'mandatory steps stay short');
    }
  });
});

test('coins have stable unique IDs and prerequisites agree with every preceding mandatory gate', () => {
  const ids = new Set();
  for (const level of levels) {
    assert.ok(level.collectibles.length >= 12);
    assert.ok(level.collectibles.some(item => item.secret));
    level.collectibles.forEach((item, index) => {
      assert.equal(item.id, `${level.id}-coin-${index + 1}`);
      assert.ok(!ids.has(item.id)); ids.add(item.id);
      assert.equal(typeof item.secret, 'boolean');
      assert.ok(Number.isFinite(item.x) && Number.isFinite(item.y));
      assert.ok(item.x > 0 && item.x < level.width && item.y > 0 && item.y < 450);
      const preceding = level.gates.filter(gate => gate.x < item.x).at(-1);
      assert.equal(item.requiresQuestion, preceding?.questionId, `${item.id}: no premature or future prerequisite`);
      assert.ok(!level.platforms.some(p => item.x > p.x && item.x < p.x + p.w && item.y > p.y && item.y < p.y + p.h), `${item.id}: not embedded in terrain`);
      if (item.secret) {
        assert.ok(level.platforms.some(p => p.x <= item.x && p.x + p.w >= item.x && p.y < item.y && item.y - p.y <= 100), `${item.id}: sheltered alcove`);
      }
    });
  }
});

// Build a conservative reachability graph using actual collision and held jumps, not just distances.
// Every launch point has room for the complete 34 x 70 collision body. Edges can only rise ~123 px.
function reachableLandings(level) {
  const solids = solidsFor(level, solvedState);
  const reachable = new Set(solids.filter(p => p.y === 450));
  const visitedCoins = new Set();
  const record = player => {
    for (const coin of level.collectibles) {
      if (coin.x >= player.x - 10 && coin.x <= player.x + player.w + 10
        && coin.y >= player.y - 10 && coin.y <= player.y + player.h + 10) visitedCoins.add(coin.id);
    }
  };
  const queue = [...reachable];
  for (let head = 0; head < queue.length; head++) {
    const source = queue[head];
    for (let x = source.x; x <= source.x + source.w - PLAYER_WIDTH; x += 12) {
      const body = { x, y: source.y - PLAYER_HEIGHT, w: PLAYER_WIDTH, h: PLAYER_HEIGHT };
      if (solids.some(p => overlaps(body, p))) continue;
      for (const axis of [-1, 0, 1]) {
        const player = createPlayer(body);
        player.grounded = true;
        record(player);
        for (let frame = 0; frame < 65; frame++) {
          stepPlayer(player, { axis, jumpPressed: frame === 0, jumpHeld: true }, FIXED_STEP, solids, level.height);
          record(player);
          if (player.grounded) {
            const landing = solids.find(p => p.y === player.y + player.h && player.x < p.x + p.w && player.x + player.w > p.x);
            if (landing && !reachable.has(landing)) { reachable.add(landing); queue.push(landing); }
            break;
          }
          if (player.y > level.height) break;
        }
      }
    }
  }
  return { reachable, visitedCoins };
}

test('optional ledges and alcove coins are reachable with the real jump envelope', () => {
  for (const level of levels) {
    const { reachable, visitedCoins } = reachableLandings(level);
    for (const coin of level.collectibles) {
      assert.ok(visitedCoins.has(coin.id), `${coin.id}: reachable by actual platform jumps`);
      const landing = level.platforms.find(p => p.x <= coin.x && p.x + p.w >= coin.x && p.y > coin.y && p.y - coin.y <= 60);
      assert.ok(landing && reachable.has(landing), `${coin.id}: accessible supporting landing`);
    }
  }
});

test('jump-when-blocked travel still reaches each machine and exit without falling', () => {
  for (const level of levels) {
    const progress = { solved: [], keys: level.id === 'castle' ? [0, 1] : [] };
    const player = createPlayer(level.spawn);
    for (const target of [...level.gates, level.exit]) {
      let lastX = -1;
      let hold = 0;
      let reached = false;
      for (let frame = 0; frame < 3000; frame++) {
        const blocked = frame % 7 === 0 && Math.abs(player.x - lastX) < 0.001;
        if (frame % 7 === 0) lastX = player.x;
        if (blocked && hold === 0) hold = 25;
        const result = stepPlayer(player, { axis: 1, jumpPressed: blocked && hold === 25, jumpHeld: hold > 0 }, FIXED_STEP, solidsFor(level, progress), level.height);
        hold = Math.max(0, hold - 1);
        assert.equal(result.fell, false, `${level.id}: no blind pit before ${target.questionId || 'exit'}`);
        if (player.x + player.w / 2 >= target.x - 110) { reached = true; break; }
      }
      assert.ok(reached, `${level.id}: reach ${target.questionId || 'exit'}`);
      if (target.questionId) progress.solved.push(target.questionId);
      if (target.questionId === 'q9') progress.keys.push(2);
    }
  }
});

test('closed mandatory gates and the three-key door block even repeated upper-route jumps', () => {
  for (const level of levels) {
    for (const barrier of [...level.gates, ...(level.keyDoor ? [level.keyDoor] : [])]) {
      assert.equal(barrier.y, 0);
      assert.equal(barrier.h, 450);
      const before = level.gates.filter(g => g.x < barrier.x).map(g => g.questionId);
      const solids = solidsFor(level, { solved: before, keys: [] });
      assert.ok(solids.includes(barrier));
      assert.ok(level.platforms.some(p => p.y === 450 && p.x <= barrier.x && p.x + p.w >= barrier.x + barrier.w));
      for (const y of [380, 280, 180, 80]) {
        const player = createPlayer({ x: barrier.x - 100, y });
        for (let frame = 0; frame < 180; frame++) {
          stepPlayer(player, { axis: 1, jumpPressed: frame % 48 === 0, jumpHeld: true }, FIXED_STEP, solids, level.height);
          assert.ok(player.x + player.w <= barrier.x, `${level.id}/${barrier.questionId || 'keyDoor'}: no bypass`);
        }
      }
    }
  }
});
