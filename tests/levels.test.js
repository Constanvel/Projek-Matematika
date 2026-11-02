import test from 'node:test';
import assert from 'node:assert/strict';
import { levels, solidsFor } from '../js/data/levels.js';
import { GameEngine } from '../js/game/engine.js';
import { freshState, completeQuestion, advanceLevel, validateState } from '../js/state.js';
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

test('saved checkpoints, gate positions and original bridge floors remain compatible across longer worlds', () => {
  levels.forEach((level, index) => {
    const original = snapshot[index];
    assert.deepEqual(level.spawn, { x: 80, y: 380 });
    const expectedFloors = original.ground.flatMap(([x, w]) => {
      const originalWidth = original.ground.at(-1)[0] + original.ground.at(-1)[1];
      let spans = [[x, w + (x + w === originalWidth ? level.width - originalWidth : 0)]];
      for (const { gap } of level.parkour) {
        spans = spans.flatMap(([left, width]) => left < gap.start && left + width > gap.end
          ? [[left, gap.start - left], [gap.end, left + width - gap.end]] : [[left, width]]);
      }
      return spans;
    });
    assert.deepEqual(level.platforms.filter(p => p.y === 450).map(p => [p.x, p.w]), expectedFloors);
    assert.deepEqual(level.gates.map(g => g.x), original.gates);
    for (const gate of level.gates) {
      const machineCheckpoint = level.checkpoints.find(cp => cp.id === `machine-${gate.questionId}`);
      assert.equal(machineCheckpoint.x, gate.x - 120, 'legacy machine restart coordinates are unchanged');
    }
    assert.equal(level.exit.y, 380);
    assert.ok(level.exit.x > original.exit + 1800, 'finale extends the playable journey beyond the legacy exit');
    assert.deepEqual(level.checkpoints.filter(cp => !cp.id.startsWith('machine-') && !cp.id.startsWith('parkour-')).map(cp => [cp.id, cp.x]), original.checkpoints);
    for (const checkpoint of level.checkpoints) {
      const body = { ...checkpoint, w: PLAYER_WIDTH, h: PLAYER_HEIGHT };
      assert.equal(checkpoint.y, 380);
      assert.ok(level.platforms.some(p => p.y === body.y + body.h && p.x <= body.x && p.x + p.w >= body.x + body.w), `${level.id}/${checkpoint.id}: full floor support`);
      assert.ok(!level.platforms.some(p => overlaps(body, p)), `${level.id}/${checkpoint.id}: unobstructed spawn`);
    }
    const floors = solidsFor(level, solvedState).filter(p => p.y === 450).sort((a, b) => a.x - b.x);
    let edge = 0;
    const removedSpans = [];
    for (const floor of floors) {
      if (floor.x > edge) removedSpans.push([edge, floor.x]);
      edge = Math.max(edge, floor.x + floor.w);
    }
    assert.deepEqual(removedSpans, level.parkour.map(({ gap }) => [gap.start, gap.end]));
    assert.equal(edge, level.width, 'only the explicit parkour spans remove original floor');
    for (const obstacle of level.platforms.filter(p => p.kind === 'ground' && p.y < 450)) {
      assert.ok(450 - obstacle.y <= 48, 'mandatory steps stay short');
    }
  });
});

test('parkour checkpoints validate only after the relevant mandatory gate is solved', () => {
  const state = freshState();
  levels.forEach((level, index) => {
    assert.equal(state.level, index);
    for (const route of level.parkour) {
      if (!state.solved.includes(route.requiresQuestion)) assert.equal(validateState({ ...state, checkpoint: route.checkpointId }), null);
      const gateIndex = level.questionIds.indexOf(route.requiresQuestion);
      for (const id of level.questionIds.slice(0, gateIndex + 1)) {
        if (!state.solved.includes(id)) { state.attempts[id] = 1; completeQuestion(state, id); }
      }
      assert.equal(validateState({ ...state, checkpoint: route.checkpointId }).checkpoint, route.checkpointId);
    }
    for (const id of level.questionIds.filter(id => !state.solved.includes(id))) {
      state.attempts[id] = 1;
      completeQuestion(state, id);
    }
    advanceLevel(state);
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
  assert.equal(ids.size, 55, 'all original collectible IDs remain stable');
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

test('route-aware timed jumps reach each machine and exit without teleporting or falling', () => {
  for (const level of levels) {
    const progress = { solved: [], keys: level.id === 'castle' ? [0, 1] : [] };
    const player = createPlayer(level.spawn);
    const jumps = level.parkour.flatMap(route => route.jumps);
    let nextJump = 0;
    for (const target of [...level.gates, level.exit]) {
      let lastX = -1;
      let hold = 0;
      let reached = false;
      for (let frame = 0; frame < 3000; frame++) {
        const blocked = frame % 7 === 0 && Math.abs(player.x - lastX) < 0.001;
        if (frame % 7 === 0) lastX = player.x;
        const timed = player.grounded && nextJump < jumps.length && player.x >= jumps[nextJump].x;
        if (timed) nextJump++;
        const press = hold === 0 && (blocked || timed);
        if (press) hold = 25;
        const result = stepPlayer(player, { axis: 1, jumpPressed: press, jumpHeld: hold > 0 }, FIXED_STEP, solidsFor(level, progress), level.height);
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

test('every mandatory parkour sequence needs every advertised jump and tolerates delayed polling', () => {
  const expectedJumps = [[2, 2, 4, 4], [3, 3, 5, 5], [3, 3, 2, 2, 2, 6, 6]];
  levels.forEach((level, index) => {
    assert.equal(level.parkour.length, [4, 4, 7][index]);
    assert.ok(level.parkour[1].start > level.gates[1].x + level.gates[1].w);
    assert.ok(level.width >= [5200, 6200, 8400][index]);
    assert.equal(level.parkour.reduce((count, route) => count + route.jumps.length, 0), [12, 16, 24][index]);
    assert.deepEqual(level.parkour.map(route => route.jumps.length), expectedJumps[index]);
    for (const route of level.parkour) {
    const checkpoint = level.checkpoints.find(cp => cp.id === route.checkpointId);
    assert.equal(checkpoint.x, route.start);
    assert.equal(checkpoint.requiresQuestion, route.requiresQuestion);
    assert.ok(route.start + PLAYER_WIDTH < route.gap.start);
    assert.ok(route.end > route.gap.end);
    for (const jump of route.jumps) {
      const landing = level.platforms.find(p => p.x === jump.landX);
      assert.ok(landing && landing.w >= 64, `${route.id}: readable landing at least 64px wide`);
      assert.ok(jump.landX - jump.x < 480, `${route.id}: landing visible before launch`);
    }
    assert.ok(!level.gates.some(g => g.x > route.start && g.x < route.end));
    const solids = solidsFor(level, solvedState);
    const simulate = (skip = -1, delay = 0) => {
      const player = createPlayer({ x: route.start, y: 380 });
      let next = 0;
      let hold = 0;
      const landings = [];
      let lastJump = -1;
      for (let frame = 0; frame < 600; frame++) {
        const timed = player.grounded && next < route.jumps.length && player.x >= route.jumps[next].x + delay;
        const press = timed && next !== skip;
        if (timed) { lastJump = next; next++; }
        if (press) hold = 25; // 0.42 seconds, matching the browser keyboard helper.
        const wasGrounded = player.grounded;
        const result = stepPlayer(player, { axis: 1, jumpPressed: press, jumpHeld: hold > 0 }, FIXED_STEP, solids, level.height);
        hold = Math.max(0, hold - 1);
        if (!wasGrounded && player.grounded && lastJump >= 0) {
          const expected = route.jumps[lastJump].landX;
          const surface = solids.find(p => p.x === expected && p.y === player.y + player.h && player.x + player.w > p.x && player.x < p.x + p.w);
          if (surface) landings.push(expected);
        }
        if (result.fell) return { passed: false, landings };
        if (player.x >= route.end && player.grounded) return { passed: true, landings };
      }
      return { passed: false, landings };
    };
    for (const delay of Array.from({ length: 16 }, (_, delay) => delay)) {
      const result = simulate(-1, delay);
      assert.equal(result.passed, true, `${level.id}: timed route, ${delay}px polling delay`);
      assert.deepEqual(result.landings, route.jumps.map(jump => jump.landX));
    }
    for (let skip = 0; skip < route.jumps.length; skip++) {
      for (const delay of Array.from({ length: 16 }, (_, delay) => delay)) {
        assert.equal(simulate(skip, delay).passed, false, `${route.id}: jump ${skip + 1} is mandatory at ${delay}px delay`);
      }
    }
    const walker = createPlayer({ x: route.start, y: 380 });
    let fell = false;
    for (let frame = 0; frame < 300; frame++) {
      if (stepPlayer(walker, { axis: 1 }, FIXED_STEP, solids, level.height).fell) { fell = true; break; }
      assert.ok(walker.x < route.end, `${level.id}: cannot walk under the elevated route`);
    }
    assert.equal(fell, true, `${level.id}/${route.id}: walking alone cannot cross the missing floor`);
    }
  });
});

test('castle middle rooms require distinct routes while keeping legacy restart floors and machine rests', () => {
  const castle = levels.find(level => level.id === 'castle');
  const rooms = [
    ['q9', castle.keyDoor.x + castle.keyDoor.w, 'q10', 'castle-vault', 370],
    ['q10', 3660 + 34, 'q11', 'castle-core-spire', 330],
    ['q11', 4500 + PLAYER_WIDTH, 'q12', 'castle-core-stride', 410],
  ];
  const rhythms = [];
  for (const [requiresQuestion, after, nextQuestion, id, elevation] of rooms) {
    const routes = castle.parkour.filter(route => route.requiresQuestion === requiresQuestion);
    assert.equal(routes.length, 1, `${requiresQuestion}: mandatory middle route`);
    const [route] = routes;
    const machine = castle.gates.find(gate => gate.questionId === nextQuestion);
    assert.equal(route.id, id);
    assert.ok(route.start > after, 'new checkpoint follows the barrier or preserved core save');
    assert.ok(route.end < machine.x - 60, 'finish on safe floor before terminal interaction');
    assert.ok(machine.x - route.gap.end >= 120, 'rest floor protects legacy machine checkpoint');
    assert.equal(route.jumps.length, 2);
    const landing = castle.platforms.find(p => p.x === route.jumps[0].landX);
    assert.equal(landing.y, elevation, 'each room has a distinct elevation');
    rhythms.push(route.jumps[1].x - route.jumps[0].x);
  }
  assert.equal(new Set(rhythms).size, 3, 'middle rooms have different launch rhythms');
});

test('authored routes cross actual dynamic surfaces with delayed launches and no falls', () => {
  for (const level of levels) {
    for (const route of level.parkour.slice(1)) {
      for (const delay of Array.from({ length: 16 }, (_, delay) => delay)) {
        let falls = 0;
        const engine = new GameEngine({ canvas: { getContext: () => ({}) }, level,
          getProgress: () => ({ ...solvedState, checkpoint: route.checkpointId }), onFall: () => falls++ });
        let next = 0, hold = 0, reached = false;
        const landings = [];
        engine.input.sample = () => {
          const press = engine.player.grounded && next < route.jumps.length && engine.player.x >= route.jumps[next].x + delay;
          if (press) { next++; hold = 25; }
          return { axis: 1, jumpPressed: press, jumpHeld: hold-- > 0 };
        };
        for (let frame = 0; frame < 1200; frame++) {
          const wasGrounded = engine.player.grounded;
          engine.update();
          if (!wasGrounded && engine.player.grounded && next) landings.push(engine.player.landedPlatform.x);
          if (falls || engine.player.x >= route.end && engine.player.grounded) { reached = !falls; break; }
        }
        assert.equal(falls, 0, `${route.id}: actual engine ${delay}px delay`);
        assert.equal(reached, true, `${route.id}: actual engine reaches safe rest area`);
        assert.deepEqual(landings, route.jumps.map(jump => jump.landX));
        if (level.gimmick.id === 'crumble') assert.ok(engine.surfaceStates.some(surface => surface.state !== 'intact'), 'crumble timers actually activate');
      }
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
