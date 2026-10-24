import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPlayer, stepPlayer, FIXED_STEP, JUMP_SPEED, MOVE_SPEED,
  COYOTE_TIME, JUMP_BUFFER_TIME,
} from '../js/game/physics.js';
import { GameInput } from '../js/game/input.js';
import { GameEngine } from '../js/game/engine.js';

const idle = { axis: 0, jumpPressed: false, jumpHeld: false };
const floor = { x: -1000, y: 300, w: 3000, h: 100 };
function standing(x = 0) {
  const player = createPlayer({ x, y: floor.y - 70 });
  stepPlayer(player, idle, FIXED_STEP, [floor], 700);
  return player;
}
function advance(player, frames, input = idle, solids = [floor]) {
  for (let i = 0; i < frames; i++) stepPlayer(player, input, FIXED_STEP, solids, 700);
}

test('player creation uses top-left coordinates and independent state', () => {
  const spawn = { x: 20, y: 30 };
  const player = createPlayer(spawn);
  assert.deepEqual([player.x, player.y, player.w, player.h], [20, 30, 34, 70]);
  assert.equal(player.grounded, false);
  player.x = 99;
  assert.equal(spawn.x, 20);
  assert.equal(createPlayer(spawn).vx, 0);
});

test('gravity lands exactly on platforms and stays grounded', () => {
  const player = createPlayer({ x: 0, y: 0 });
  advance(player, 90);
  assert.equal(player.y, 230);
  assert.equal(player.vy, 0);
  assert.equal(player.grounded, true);
});

test('movement accelerates, clamps axis, brakes, and changes facing', () => {
  const player = standing();
  advance(player, 60, { ...idle, axis: 10 });
  assert.equal(player.vx, MOVE_SPEED);
  assert.equal(player.facing, 1);
  advance(player, 10);
  assert.equal(player.vx, 0);
  advance(player, 10, { ...idle, axis: -1 });
  assert.equal(player.facing, -1);
  assert.equal(player.vx, -MOVE_SPEED);
});

test('solid walls stop motion on both sides without tunneling', () => {
  const wall = { x: 100, y: 0, w: 20, h: 300 };
  const left = standing(0);
  advance(left, 90, { ...idle, axis: 1 }, [floor, wall]);
  assert.equal(left.x + left.w, wall.x);
  assert.equal(left.vx, 0);
  const right = standing(160);
  advance(right, 90, { ...idle, axis: -1 }, [floor, wall]);
  assert.equal(right.x, wall.x + wall.w);
  const falling = createPlayer({ x: 0, y: 0 });
  falling.vy = 1100;
  stepPlayer(falling, idle, 0.1, [{ x: -20, y: 100, w: 100, h: 2 }], 700);
  assert.equal(falling.y, 30);
  assert.equal(falling.grounded, true);
});

test('jump hits ceilings and does not pass through platform undersides', () => {
  const player = standing();
  const ceiling = { x: -100, y: 130, w: 300, h: 20 };
  const jump = { axis: 0, jumpPressed: true, jumpHeld: true };
  stepPlayer(player, jump, FIXED_STEP, [floor, ceiling], 700);
  let hit = false;
  for (let i = 0; i < 30; i++) {
    stepPlayer(player, { ...jump, jumpPressed: false }, FIXED_STEP, [floor, ceiling], 700);
    if (player.y === 150) {
      assert.equal(player.vy, 0);
      hit = true;
      break;
    }
  }
  assert.equal(hit, true);
});

test('coyote jump succeeds inside 0.1 seconds and expires outside it', () => {
  assert.equal(COYOTE_TIME, 0.1);
  const early = standing();
  advance(early, 4, idle, []);
  stepPlayer(early, { ...idle, jumpPressed: true, jumpHeld: true }, FIXED_STEP, [], 700);
  assert.ok(early.vy < 0);
  const late = standing();
  advance(late, 9, idle, []);
  stepPlayer(late, { ...idle, jumpPressed: true, jumpHeld: true }, FIXED_STEP, [], 700);
  assert.ok(late.vy > 0);
});

test('jump buffering consumes a press on landing and expires after 0.12 seconds', () => {
  assert.equal(JUMP_BUFFER_TIME, 0.12);
  const buffered = createPlayer({ x: 0, y: 210 });
  buffered.vy = 150;
  stepPlayer(buffered, { ...idle, jumpPressed: true, jumpHeld: true }, FIXED_STEP, [floor], 700);
  for (let i = 0; i < 6 && buffered.vy >= 0; i++) {
    stepPlayer(buffered, { ...idle, jumpHeld: true }, FIXED_STEP, [floor], 700);
  }
  assert.equal(buffered.vy, -JUMP_SPEED);
  assert.equal(buffered.grounded, false);
  assert.equal(buffered.jumpBufferTime, 0);

  const expired = createPlayer({ x: 0, y: -200 });
  stepPlayer(expired, { ...idle, jumpPressed: true, jumpHeld: true }, FIXED_STEP, [floor], 700);
  advance(expired, 90, { ...idle, jumpHeld: true });
  assert.equal(expired.grounded, true);
  assert.equal(expired.jumpBufferTime, 0);
});

test('holding jump does not auto-jump, release creates a lower jump', () => {
  const held = standing();
  const tapped = standing();
  const press = { ...idle, jumpPressed: true, jumpHeld: true };
  stepPlayer(held, press, FIXED_STEP, [floor], 700);
  stepPlayer(tapped, press, FIXED_STEP, [floor], 700);
  advance(held, 10, { ...idle, jumpHeld: true });
  advance(tapped, 10);
  assert.ok(held.y < tapped.y);
  advance(held, 120, { ...idle, jumpHeld: true });
  assert.equal(held.grounded, true);
});

test('falls are reported only after the player leaves world height', () => {
  const player = createPlayer({ x: 0, y: 701 });
  assert.deepEqual(stepPlayer(player, idle, FIXED_STEP, [], 700), { fell: true });
  const safe = standing();
  assert.deepEqual(stepPlayer(safe, idle, FIXED_STEP, [floor], 700), { fell: false });
});

test('fixed-step runs are deterministic', () => {
  const simulate = () => {
    const player = standing();
    for (let i = 0; i < 240; i++) {
      stepPlayer(player, {
        axis: i < 120 ? 1 : -1, jumpPressed: i === 20 || i === 100,
        jumpHeld: (i >= 20 && i < 35) || (i >= 100 && i < 115),
      }, FIXED_STEP, [floor, { x: 500, y: 180, w: 150, h: 20 }], 700);
    }
    return player;
  };
  assert.deepEqual(simulate(), simulate());
});

test('input tracks simultaneous pointer sources and consumes jump edge once', () => {
  let interactions = 0;
  const input = new GameInput({ target: null, controls: null, onInteract: () => interactions++ });
  const button = action => ({ dataset: { control: action }, setPointerCapture() {} });
  const touch = (id, action) => input.pointerDown({
    pointerId: id, button: 0, target: { closest: () => button(action) }, preventDefault() {},
  });
  touch(1, 'right');
  touch(2, 'jump');
  assert.deepEqual(input.sample(), { axis: 1, jumpPressed: true, jumpHeld: true });
  assert.equal(input.sample().jumpPressed, false);
  touch(3, 'right');
  input.release('pointer:1');
  assert.equal(input.sample().axis, 1);
  touch(4, 'interact');
  assert.equal(interactions, 1);
  input.setPaused(true);
  assert.deepEqual(input.sample(), idle);
  touch(5, 'jump');
  assert.deepEqual(input.sample(), idle);
});

test('keyboard ignores editable targets, repeat, and clears on blur', () => {
  let pauses = 0;
  let blurs = 0;
  const input = new GameInput({ target: null, controls: null,
    onPause: () => pauses++, onBlur: () => blurs++ });
  const key = (code, extra = {}) => input.keyDown({ code, preventDefault() {}, ...extra });
  key('Space', { target: { tagName: 'INPUT' } });
  key('KeyD');
  key('Space');
  assert.equal(input.sample().jumpPressed, true);
  key('Space', { repeat: true });
  assert.equal(input.sample().jumpPressed, false);
  key('Escape');
  assert.equal(pauses, 1);
  input.handlers.blur();
  assert.equal(blurs, 1);
  assert.deepEqual(input.sample(), idle);
});

function makeEngine(overrides = {}) {
  const progress = { solved: [], keys: [], checkpoint: 'start' };
  const level = {
    width: 2000, height: 700, spawn: { x: 10, y: 230 }, platforms: [floor],
    gates: [{ id: 'g1', questionId: 'q1', x: 300, y: 0, w: 34, h: 300,
      bridge: { x: 500, y: 300, w: 100, h: 20 } }],
    checkpoints: [{ id: 'start', x: 10, y: 230 }, { id: 'next', x: 600, y: 230 }],
    exit: { x: 1800, y: 230 },
  };
  const engine = new GameEngine({
    canvas: { getContext: () => ({}) }, level, getProgress: () => progress, ...overrides,
  });
  return { engine, progress, level };
}

test('engine gate proximity works from left and solved gates support review', () => {
  const interactions = [];
  const { engine, progress } = makeEngine({ onInteract: target => interactions.push(target) });
  engine.player.x = 200;
  assert.equal(engine.nearest()?.type, 'gate');
  assert.equal(engine.nearest()?.id, 'g1');
  engine.running = true;
  engine.interact();
  progress.solved.push('q1');
  engine.interact();
  assert.equal(interactions.length, 2);
  assert.equal(engine.solids(progress).some(solid => solid.id === 'g1'), false);
  assert.equal(engine.solids(progress).some(solid => solid.x === 500), true);
  engine.setPaused(true);
  engine.interact();
  assert.equal(interactions.length, 2);
  engine.player.x = 1720;
  assert.equal(engine.nearest()?.type, 'exit');
});

test('checkpoints notify once, persist locally, and reset physics on fall', () => {
  const checkpoints = [];
  let falls = 0;
  const { engine, progress } = makeEngine({ onCheckpoint: id => checkpoints.push(id), onFall: () => falls++ });
  engine.player.x = 600;
  engine.update();
  engine.update();
  assert.deepEqual(checkpoints, ['next']);
  assert.equal(progress.checkpoint, 'start');
  engine.player.y = 900;
  engine.player.vx = 123;
  engine.update();
  assert.equal(falls, 1);
  assert.equal(engine.player.x, 600);
  assert.equal(engine.player.y, 230);
  assert.equal(engine.player.vx, 0);
  assert.equal(engine.player.vy, 0);
});

test('checkpoint activation cannot regress and respects key requirements', () => {
  const activated = [];
  const { engine, progress, level } = makeEngine({ onCheckpoint: id => activated.push(id) });
  level.checkpoints.push({ id: 'locked', x: 900, y: 230, requiresKeys: 3 });
  engine.player.x = 600;
  engine.update();
  progress.checkpoint = 'next';
  engine.player.x = 10;
  engine.update();
  assert.equal(engine.checkpointId, 'next');
  assert.deepEqual(activated, ['next']);
  engine.player.x = 900;
  engine.update();
  assert.deepEqual(activated, ['next']);
  progress.keys = [0, 1, 2];
  engine.update();
  assert.deepEqual(activated, ['next', 'locked']);
});

test('solved-machine checkpoints are locked until solved and never steal terminal interaction', () => {
  const { engine, progress, level } = makeEngine();
  level.checkpoints.push({ id: 'machine-q1', x: 180, y: 230, requiresQuestion: 'q1' });
  engine.player.x = 180;
  engine.detectCheckpoint(progress);
  assert.equal(engine.checkpointId, 'start');
  assert.equal(engine.rememberCheckpoint('machine-q1'), false);
  progress.solved.push('q1');
  assert.equal(engine.rememberCheckpoint('machine-q1'), true);
  progress.checkpoint = 'machine-q1';
  assert.equal(engine.nearest().type, 'gate');
  engine.respawn();
  assert.equal(engine.player.x, 180);
});

test('camera dead zone tolerates small movement and clamps both world ends', () => {
  const { engine, level } = makeEngine();
  engine.player.x = 420; engine.camera = 100; engine.updateCamera();
  assert.equal(engine.camera, 100);
  engine.player.x = 700; engine.updateCamera();
  assert.ok(engine.camera > 100);
  engine.player.x = 0; engine.updateCamera(); assert.equal(engine.camera, 0);
  engine.player.x = level.width; engine.updateCamera(); assert.equal(engine.camera, level.width - 960);
});

test('Escape pauses from button focus while movement remains ignored', () => {
  let pauses = 0;
  const input = new GameInput({ onPause: () => pauses++ });
  const event = code => ({ code, target: { tagName: 'BUTTON' }, preventDefault() {} });
  input.keyDown(event('KeyD')); assert.equal(input.sample().axis, 0);
  input.keyDown(event('Escape')); assert.equal(pauses, 1);
});

test('full-height gates are reachable at floor height without selecting future gates', () => {
  const { engine, level, progress } = makeEngine();
  level.gates[0].h = 450;
  level.gates.push({ id: 'g2', questionId: 'q2', x: 650, y: 0, w: 34, h: 450 });
  level.keyDoor = { x: 1000, y: 0, w: 30, h: 450 };
  engine.player.x = 190;
  engine.player.y = 380;
  assert.equal(engine.nearest()?.id, 'g1');
  engine.player.x = 440;
  assert.equal(engine.nearest(), null);
  assert.equal(engine.solids(progress).includes(level.keyDoor), true);
  progress.keys = [0, 1, 2];
  assert.equal(engine.solids(progress).includes(level.keyDoor), false);
});

test('engine uses one RAF, at most five fixed updates, draws when paused, and signals blur', () => {
  const oldRequest = globalThis.requestAnimationFrame;
  const oldCancel = globalThis.cancelAnimationFrame;
  const callbacks = new Map();
  let nextId = 0;
  globalThis.requestAnimationFrame = callback => { callbacks.set(++nextId, callback); return nextId; };
  globalThis.cancelAnimationFrame = id => callbacks.delete(id);
  let draws = 0;
  const pauses = [];
  try {
    const { engine } = makeEngine({ draw: frame => {
      draws++;
      assert.equal(typeof frame.camera, 'number');
      assert.equal(frame.canvas.width, 960);
      assert.equal(frame.canvas.height, 540);
    }, onPause: paused => pauses.push(paused) });
    const runFrame = timestamp => {
      assert.equal(callbacks.size, 1);
      const [id, callback] = callbacks.entries().next().value;
      callbacks.delete(id);
      callback(timestamp);
    };
    engine.start();
    engine.start();
    assert.equal(callbacks.size, 1);
    runFrame(0);
    runFrame(1000);
    assert.ok(Math.abs(engine.time - FIXED_STEP * 5) < 1e-10);
    engine.input.handlers.blur();
    assert.deepEqual(pauses, [true]);
    assert.equal(engine.paused, true);
    const time = engine.time;
    runFrame(1100);
    assert.equal(engine.time, time);
    assert.equal(draws, 3);
    engine.setPaused(false);
    runFrame(1200);
    assert.equal(engine.time, time);
    engine.stop();
    assert.equal(callbacks.size, 0);
  } finally {
    if (oldRequest === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = oldRequest;
    if (oldCancel === undefined) delete globalThis.cancelAnimationFrame;
    else globalThis.cancelAnimationFrame = oldCancel;
  }
});
