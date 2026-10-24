export const PLAYER_WIDTH = 34;
export const PLAYER_HEIGHT = 70;
export const MOVE_SPEED = 300;
export const MOVE_ACCELERATION = 2400;
export const MOVE_FRICTION = 2800;
export const GRAVITY = 2000;
export const JUMP_SPEED = 720;
export const MAX_FALL_SPEED = 1100;
export const COYOTE_TIME = 0.1;
export const JUMP_BUFFER_TIME = 0.12;
export const FIXED_STEP = 1 / 60;

export const constants = Object.freeze({
  PLAYER_WIDTH, PLAYER_HEIGHT, MOVE_SPEED, MOVE_ACCELERATION, MOVE_FRICTION,
  GRAVITY, JUMP_SPEED, MAX_FALL_SPEED, COYOTE_TIME, JUMP_BUFFER_TIME, FIXED_STEP,
});

export function createPlayer(spawn = { x: 0, y: 0 }) {
  return {
    x: spawn.x, y: spawn.y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT,
    vx: 0, vy: 0, grounded: false, facing: 1,
    coyoteTime: 0, jumpBufferTime: 0, jumpCutApplied: false,
  };
}

const overlaps = (a, sizeA, b, sizeB) => a < b + sizeB && a + sizeA > b;
const approach = (value, target, amount) => value < target
  ? Math.min(value + amount, target) : Math.max(value - amount, target);

function jump(player) {
  player.vy = -JUMP_SPEED;
  player.grounded = false;
  player.coyoteTime = 0;
  player.jumpBufferTime = 0;
  player.jumpCutApplied = false;
}

/** Axis-separated swept AABB collision. Coordinates describe top-left corners. */
export function stepPlayer(player, input = {}, dt = FIXED_STEP, solids = [], worldHeight = Infinity) {
  if (!Number.isFinite(dt) || dt <= 0) return { fell: player.y > worldHeight };

  player.coyoteTime = player.grounded
    ? COYOTE_TIME : Math.max(0, (player.coyoteTime || 0) - dt);
  player.jumpBufferTime = input.jumpPressed
    ? JUMP_BUFFER_TIME : Math.max(0, (player.jumpBufferTime || 0) - dt);

  const axis = Math.max(-1, Math.min(1, Number(input.axis) || 0));
  player.vx = approach(player.vx, axis * MOVE_SPEED,
    (axis ? MOVE_ACCELERATION : MOVE_FRICTION) * dt);
  if (axis) player.facing = Math.sign(axis);

  if (player.jumpBufferTime > 0 && player.coyoteTime > 0) jump(player);
  if (!input.jumpHeld && player.vy < 0 && !player.jumpCutApplied) {
    player.vy *= 0.45;
    player.jumpCutApplied = true;
  }
  player.vy = Math.min(MAX_FALL_SPEED, player.vy + GRAVITY * dt);

  let nextX = player.x + player.vx * dt;
  for (const solid of solids) {
    if (!overlaps(player.y, player.h, solid.y, solid.h)) continue;
    if (player.vx > 0 && player.x + player.w <= solid.x && nextX + player.w >= solid.x) {
      nextX = Math.min(nextX, solid.x - player.w);
    } else if (player.vx < 0 && player.x >= solid.x + solid.w && nextX <= solid.x + solid.w) {
      nextX = Math.max(nextX, solid.x + solid.w);
    }
  }
  if (nextX !== player.x + player.vx * dt) player.vx = 0;
  player.x = nextX;

  let nextY = player.y + player.vy * dt;
  let landed = false;
  let hitCeiling = false;
  for (const solid of solids) {
    if (!overlaps(player.x, player.w, solid.x, solid.w)) continue;
    if (player.vy >= 0 && player.y + player.h <= solid.y && nextY + player.h >= solid.y) {
      nextY = Math.min(nextY, solid.y - player.h);
      landed = true;
    } else if (player.vy < 0 && player.y >= solid.y + solid.h && nextY <= solid.y + solid.h) {
      nextY = Math.max(nextY, solid.y + solid.h);
      hitCeiling = true;
    }
  }
  player.y = nextY;
  player.grounded = landed;
  if (landed || hitCeiling) player.vy = 0;
  if (landed) {
    player.coyoteTime = COYOTE_TIME;
    // A press shortly before landing is consumed immediately, not one frame later.
    if (player.jumpBufferTime > 0) {
      jump(player);
      if (!input.jumpHeld) {
        player.vy *= 0.45;
        player.jumpCutApplied = true;
      }
    }
  }
  return { fell: player.y > worldHeight };
}
