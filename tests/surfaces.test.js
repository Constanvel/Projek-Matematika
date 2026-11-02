import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPlayer, stepPlayer, FIXED_STEP, GRAVITY, JUMP_SPEED, SPRING_JUMP_SPEED,
  MOVE_FRICTION, MOVE_ACCELERATION, ICE_FRICTION, ICE_ACCELERATION,
} from '../js/game/physics.js';
import { GameEngine, CRUMBLE_DELAY, CRUMBLE_RESPAWN_DELAY } from '../js/game/engine.js';
import { solidsFor } from '../js/data/levels.js';

const idle = { axis: 0, jumpPressed: false, jumpHeld: false };
const press = { ...idle, jumpPressed: true, jumpHeld: true };
const floor = surface => ({ x: 0, y: 300, w: 500, h: 30, ...(surface ? { surface } : {}) });
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

function standing(platform) {
  const player = createPlayer({ x: 100, y: platform.y - 70 });
  stepPlayer(player, idle, FIXED_STEP, [platform]);
  return player;
}

function makeEngine(surface, options = {}) {
  const platform = floor(surface);
  const level = {
    width: 2000, height: 10000, spawn: { x: 100, y: 230 }, platforms: [platform],
    gates: [], checkpoints: [],
  };
  const engine = new GameEngine({ canvas: { getContext: () => ({}) }, level, ...options });
  return { engine, level, platform };
}

function advance(engine, frames) {
  for (let i = 0; i < frames; i++) engine.update();
}

function crackAndLeave(engine) {
  engine.update();
  assert.equal(engine.surfaceStates[0].state, 'cracking');
  close(engine.surfaceStates[0].remaining, CRUMBLE_DELAY);
  engine.player.x = 800;
  advance(engine, Math.round(CRUMBLE_DELAY / FIXED_STEP));
  assert.equal(engine.surfaceStates[0].state, 'gone');
}

test('spring requires a manual jump and boosts its impulse without changing ordinary jumps', () => {
  const spring = floor('spring');
  const player = standing(spring);
  for (let i = 0; i < 90; i++) stepPlayer(player, { ...idle, jumpHeld: true }, FIXED_STEP, [spring]);
  assert.equal(player.grounded, true);
  assert.equal(player.vy, 0);
  stepPlayer(player, press, FIXED_STEP, [spring]);
  close(player.vy, -SPRING_JUMP_SPEED + GRAVITY * FIXED_STEP);
  assert.equal(player.jumpSurface, 'spring');
  assert.equal(player.grounded, false);

  const ordinary = floor();
  const regularPlayer = standing(ordinary);
  stepPlayer(regularPlayer, press, FIXED_STEP, [ordinary]);
  close(regularPlayer.vy, -JUMP_SPEED + GRAVITY * FIXED_STEP);
  assert.ok(player.vy < regularPlayer.vy);
});

test('spring supports buffered manual jumps and emits one engine spring event', () => {
  const spring = floor('spring');
  const player = createPlayer({ x: 100, y: 229 });
  player.vy = 150;
  stepPlayer(player, press, FIXED_STEP, [spring]);
  assert.equal(player.vy, -SPRING_JUMP_SPEED);
  assert.equal(player.landedPlatform, spring);

  const events = [];
  const { engine } = makeEngine('spring', { onEvent: type => events.push(type) });
  advance(engine, 3);
  assert.equal(events.includes('spring'), false);
  engine.input.sample = () => press;
  engine.update();
  engine.input.sample = () => ({ ...idle, jumpHeld: true });
  advance(engine, 3);
  assert.equal(events.filter(type => type === 'spring').length, 1);
  assert.ok(engine.effects.some(effect => effect.type === 'spring'));
});

test('ice reduces grounded acceleration and braking but preserves ordinary and airborne physics', () => {
  const ice = floor('ice');
  const ordinary = floor();
  const icy = standing(ice);
  const regular = standing(ordinary);
  icy.vx = regular.vx = 300;
  stepPlayer(icy, idle, FIXED_STEP, [ice]);
  stepPlayer(regular, idle, FIXED_STEP, [ordinary]);
  close(icy.vx, 300 - ICE_FRICTION * FIXED_STEP);
  close(regular.vx, 300 - MOVE_FRICTION * FIXED_STEP);
  assert.ok(icy.vx > regular.vx);
  icy.vx = regular.vx = 0;
  stepPlayer(icy, { ...idle, axis: 1 }, FIXED_STEP, [ice]);
  stepPlayer(regular, { ...idle, axis: 1 }, FIXED_STEP, [ordinary]);
  close(icy.vx, ICE_ACCELERATION * FIXED_STEP);
  close(regular.vx, MOVE_ACCELERATION * FIXED_STEP);

  icy.grounded = false;
  icy.y = 100;
  icy.vx = 300;
  stepPlayer(icy, idle, FIXED_STEP, [ice]);
  close(icy.vx, 300 - MOVE_FRICTION * FIXED_STEP);
  icy.vx = 0;
  stepPlayer(icy, { ...idle, axis: 1 }, FIXED_STEP, [ice]);
  close(icy.vx, MOVE_ACCELERATION * FIXED_STEP);
});

test('crumble cracks on contact, disappears after leaving, and restores the same solid', () => {
  const { engine, level, platform } = makeEngine('crumble');
  assert.equal(engine.surfaceStates[0].state, 'intact');
  assert.equal(engine.surfaceStates[0].remaining, 0);
  assert.equal(engine.solids({})[0], platform);
  crackAndLeave(engine);
  assert.equal(engine.solids({}).includes(platform), false);
  // Route simulations intentionally retain regular platform collision.
  assert.equal(solidsFor(level, { solved: [], keys: [] })[0], platform);
  close(engine.surfaceStates[0].remaining, CRUMBLE_RESPAWN_DELAY);
  advance(engine, Math.round(CRUMBLE_RESPAWN_DELAY / FIXED_STEP) - 1);
  assert.equal(engine.surfaceStates[0].state, 'gone');
  engine.update();
  assert.equal(engine.surfaceStates[0].state, 'intact');
  assert.equal(engine.solids({})[0], platform);
});

test('crumble countdown does not restart under continuous contact and falling resets it', () => {
  const { engine, platform } = makeEngine('crumble');
  engine.update();
  advance(engine, Math.round(CRUMBLE_DELAY / FIXED_STEP));
  assert.equal(engine.surfaceStates[0].state, 'gone');
  assert.equal(engine.solids({}).includes(platform), false);
  engine.update();
  assert.equal(engine.player.grounded, false);
  assert.ok(engine.player.vy > 0);
  engine.player.y = engine.level.height + 1;
  engine.update();
  assert.equal(engine.surfaceStates[0].state, 'intact');
  assert.equal(engine.solids({})[0], platform);
});

test('crumble restoration waits until the player no longer overlaps the missing platform', () => {
  const { engine, platform } = makeEngine('crumble');
  crackAndLeave(engine);
  advance(engine, Math.round(CRUMBLE_RESPAWN_DELAY / FIXED_STEP) - 1);
  engine.player.x = platform.x + 50;
  engine.player.y = platform.y;
  engine.player.vy = 0;
  engine.update();
  assert.equal(engine.surfaceStates[0].state, 'gone');
  assert.equal(engine.surfaceStates[0].remaining, 0);
  engine.player.x = 800;
  engine.update();
  assert.equal(engine.surfaceStates[0].state, 'intact');
});

test('crumble timers pause with fixed time, appear on frames, and reset on respawn', () => {
  const oldRequest = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => 1;
  let frame;
  try {
    const { engine, platform } = makeEngine('crumble', { draw: value => { frame = value; } });
    crackAndLeave(engine);
    const time = engine.time;
    const remaining = engine.surfaceStates[0].remaining;
    engine.setPaused(true);
    advance(engine, 300);
    engine.running = true;
    engine.frame(0);
    engine.frame(60000);
    assert.equal(engine.time, time);
    assert.equal(frame.surfaceStates[0].state, 'gone');
    assert.equal(frame.surfaceStates[0].remaining, remaining);
    assert.equal(frame.surfaceStates[0].platform, platform);
    assert.equal(frame.surfaceStates[0].x, platform.x);
    assert.equal(frame.surfaceStates[0].y, platform.y);
    engine.setPaused(false);
    advance(engine, Math.round(CRUMBLE_RESPAWN_DELAY / FIXED_STEP));
    assert.equal(engine.surfaceStates[0].state, 'intact');
    engine.respawn();
    assert.equal(engine.surfaceStates[0].state, 'intact');
    assert.equal(engine.surfaceStates[0].remaining, 0);
    engine.update();
    assert.equal(engine.surfaceStates[0].state, 'cracking');
    engine.respawn();
    assert.equal(engine.surfaceStates[0].state, 'intact');
    assert.equal(engine.solids({})[0], platform);
    engine.update();
    engine.player.y = engine.level.height + 1;
    engine.update();
    assert.equal(engine.surfaceStates[0].state, 'intact');
  } finally {
    if (oldRequest === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = oldRequest;
  }
});
