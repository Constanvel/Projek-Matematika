import { createPlayer, stepPlayer, FIXED_STEP } from './physics.js';
import { GameInput } from './input.js';
import { solidsFor } from '../data/levels.js';

const WIDTH = 960;
const HEIGHT = 540;
const noop = () => {};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distanceToInterval = (value, min, max) => Math.max(min - value, 0, value - max);

export class GameEngine {
  constructor({ canvas, level, getProgress = () => ({}), onInteract = noop,
    onCheckpoint = noop, onFall = noop, onFrame = noop, draw = noop, onPause = noop,
    onCollect = noop, onEvent = noop }) {
    this.canvas = canvas;
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.ctx = canvas.getContext('2d');
    this.level = level;
    this.getProgress = getProgress;
    this.onInteract = onInteract;
    this.onCheckpoint = onCheckpoint;
    this.onFall = onFall;
    this.onFrame = onFrame;
    this.draw = draw;
    this.onPause = onPause;
    this.onCollect = onCollect;
    this.onEvent = onEvent;
    this.collected = new Set(this.getProgress()?.collected || []);
    this.effects = [];
    this.running = false;
    this.paused = false;
    this.frameId = null;
    this.lastTime = null;
    this.accumulator = 0;
    this.time = 0;
    this.camera = 0;
    this.checkpointId = this.getProgress()?.checkpoint ?? null;
    this.lastNotifiedCheckpoint = this.checkpointId;
    this.player = createPlayer(level.spawn);
    this.input = new GameInput({
      onInteract: () => this.interact(),
      onPause: () => { this.setPaused(!this.paused); this.onPause(this.paused); },
      onBlur: () => {
        if (!this.running) return;
        this.setPaused(true);
        this.onPause(true);
      },
    });
    this.tick = timestamp => this.frame(timestamp);
    this.respawn(this.checkpointId);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = null;
    this.accumulator = 0;
    this.input.attach();
    this.frameId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null;
    this.lastTime = null;
    this.accumulator = 0;
    this.input.detach();
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
    this.input.setPaused(this.paused);
    this.accumulator = 0;
    this.lastTime = null;
  }

  respawn(checkpointId = this.getProgress()?.checkpoint ?? this.checkpointId) {
    const progress = this.getProgress() || {};
    const checkpoint = (this.level.checkpoints || []).find(cp => cp.id === checkpointId
      && (cp.requiresKeys || 0) <= (progress.keys?.length || 0)
      && (!cp.requiresQuestion || progress.solved?.includes(cp.requiresQuestion)));
    this.checkpointId = checkpoint?.id ?? null;
    this.player = createPlayer(checkpoint || this.level.spawn);
    this.input.clear();
    this.camera = clamp(this.player.x + this.player.w / 2 - WIDTH * 0.4, 0, Math.max(0, this.level.width - WIDTH));
  }

  rememberCheckpoint(id) {
    const progress = this.getProgress() || {};
    const target = this.level.checkpoints.find(cp => cp.id === id);
    const current = this.level.checkpoints.find(cp => cp.id === this.checkpointId);
    if (!target || target.x < (current?.x ?? 0) || (target.requiresKeys || 0) > (progress.keys?.length || 0)
      || (target.requiresQuestion && !progress.solved?.includes(target.requiresQuestion))) return false;
    this.checkpointId = target.id;
    this.lastNotifiedCheckpoint = target.id;
    return true;
  }

  updateCamera() {
    const center = this.player.x + this.player.w / 2;
    const screenX = center - this.camera;
    const moving = Math.abs(this.player.vx) > 20;
    let target = this.camera;
    if (moving) target = center - WIDTH * (this.player.facing < 0 ? 0.62 : 0.38);
    else if (screenX > WIDTH * 0.45) target = center - WIDTH * 0.45;
    else if (screenX < WIDTH * 0.3) target = center - WIDTH * 0.3;
    this.camera += (target - this.camera) * 0.12;
    if (this.player.x <= 0) this.camera = 0;
    if (this.player.x >= this.level.width - this.player.w) this.camera = this.level.width - WIDTH;
    this.camera = clamp(this.camera, 0, Math.max(0, this.level.width - WIDTH));
  }

  emit(type, x = this.player.x + this.player.w / 2, y = this.player.y + this.player.h) {
    this.effects.push({ type, x, y, time: this.time });
    this.onEvent(type);
  }

  detectCollectibles(progress) {
    for (const item of this.level.collectibles || []) {
      if (this.collected.has(item.id) || progress.collected?.includes(item.id)) continue;
      if (item.requiresQuestion && !progress.solved?.includes(item.requiresQuestion)) continue;
      if (this.level.gates.some(gate => gate.x < item.x && !progress.solved?.includes(gate.questionId))) continue;
      const player = this.player;
      if (item.x < player.x - 10 || item.x > player.x + player.w + 10
        || item.y < player.y - 10 || item.y > player.y + player.h + 10) continue;
      this.collected.add(item.id);
      this.emit(item.secret ? 'secret' : 'coin', item.x, item.y);
      this.onCollect(item);
    }
  }

  solids(progress) {
    return solidsFor(this.level, { solved: progress.solved || [], keys: progress.keys || [] });
  }

  detectCheckpoint(progress) {
    const checkpoints = this.level.checkpoints || [];
    const saved = checkpoints.find(cp => cp.id === progress.checkpoint);
    const local = checkpoints.find(cp => cp.id === this.checkpointId);
    const furthestX = Math.max(saved?.x ?? -Infinity, local?.x ?? -Infinity);
    const checkpoint = checkpoints.find(cp => cp.x >= furthestX
      && Math.abs(this.player.x - cp.x) <= 50 && Math.abs(this.player.y - cp.y) <= 100
      && (cp.requiresKeys || 0) <= (progress.keys?.length || 0)
      && (!cp.requiresQuestion || progress.solved?.includes(cp.requiresQuestion)));
    if (!checkpoint) return;
    this.checkpointId = checkpoint.id;
    if (checkpoint.id === progress.checkpoint) {
      this.lastNotifiedCheckpoint = checkpoint.id;
    } else if (checkpoint.id !== this.lastNotifiedCheckpoint) {
      this.lastNotifiedCheckpoint = checkpoint.id;
      this.emit('checkpoint', checkpoint.x, checkpoint.y);
      this.onCheckpoint(checkpoint.id);
    }
  }

  /** Returns a shallow copy with type: 'gate', 'checkpoint', or 'exit'. */
  nearest() {
    const x = this.player.x + this.player.w / 2;
    const y = this.player.y + this.player.h / 2;
    const progress = this.getProgress() || {};
    const candidates = [];
    for (const gate of this.level.gates || []) {
      // Distance to the rectangle, not its center: tall barriers remain reachable from the left.
      const dx = distanceToInterval(x, gate.x, gate.x + gate.w);
      const dy = distanceToInterval(y, gate.y, gate.y + gate.h);
      if (dx <= 120 && dy <= 140) candidates.push({ ...gate, type: 'gate', distance: dx + dy });
    }
    for (const checkpoint of this.level.checkpoints || []) {
      const dx = Math.abs(this.player.x - checkpoint.x);
      const dy = Math.abs(this.player.y - checkpoint.y);
      if (dx <= 50 && dy <= 100 && (checkpoint.requiresKeys || 0) <= (progress.keys?.length || 0)
        && (!checkpoint.requiresQuestion || progress.solved?.includes(checkpoint.requiresQuestion))) {
        candidates.push({ ...checkpoint, type: 'checkpoint', distance: dx + dy });
      }
    }
    const exit = this.level.exit;
    if (exit) {
      const dx = Math.abs(this.player.x - exit.x);
      const dy = Math.abs(this.player.y - exit.y);
      if (dx <= 140 && dy <= 160) candidates.push({ ...exit, type: 'exit', distance: dx + dy });
    }
    // Flags activate automatically; never let one hide a nearby usable terminal.
    candidates.sort((a, b) => Number(a.type === 'checkpoint') - Number(b.type === 'checkpoint') || a.distance - b.distance);
    if (!candidates.length) return null;
    const { distance, ...target } = candidates[0];
    return target;
  }

  interact() {
    if (this.paused || !this.running) return null;
    const target = this.nearest();
    if (target) this.onInteract(target);
    return target;
  }

  update() {
    const progress = this.getProgress() || {};
    const wasGrounded = this.player.grounded;
    const previousVy = this.player.vy;
    const result = stepPlayer(this.player, this.input.sample(), FIXED_STEP,
      this.solids(progress), this.level.height);
    if (this.player.vy < -200 && (wasGrounded || previousVy >= 0)) this.emit('jump');
    if (!wasGrounded && this.player.grounded && previousVy > 100) {
      this.player.landedAt = this.time;
      this.emit('land');
    }
    if (this.player.grounded && Math.abs(this.player.vx) > 180 && Math.floor(this.time * 12) !== Math.floor((this.time + FIXED_STEP) * 12)) this.emit('dust');
    this.effects = this.effects.filter(effect => this.time - effect.time < 1.2);
    this.player.x = clamp(this.player.x, 0, Math.max(0, this.level.width - this.player.w));
    if (result.fell) {
      // The local checkpoint also works when persistence is asynchronous.
      this.respawn(this.checkpointId ?? progress.checkpoint);
      this.onFall();
    } else {
      this.detectCheckpoint(progress);
      this.detectCollectibles(progress);
    }
    this.time += FIXED_STEP;
    this.updateCamera();
  }

  frame(timestamp) {
    if (!this.running) return;
    this.frameId = null;
    const elapsed = this.lastTime === null ? 0 : clamp((timestamp - this.lastTime) / 1000, 0, 0.1);
    this.lastTime = timestamp;
    if (!this.paused) {
      this.accumulator += elapsed;
      let steps = 0;
      while (this.accumulator >= FIXED_STEP && steps < 5 && !this.paused && this.running) {
        this.accumulator -= FIXED_STEP;
        this.update();
        steps++;
      }
      // Drop excess time after a stall rather than carrying an unbounded backlog.
      if (steps === 5) this.accumulator %= FIXED_STEP;
    }
    const frame = {
      ctx: this.ctx, canvas: this.canvas, level: this.level, player: this.player,
      camera: this.camera, time: this.time, progress: this.getProgress() || {}, effects: this.effects,
    };
    this.onFrame(frame);
    this.draw(frame);
    if (this.running) this.frameId = requestAnimationFrame(this.tick);
  }
}
