import { createRenderer } from './renderer.js';
import { levels } from '../data/levels.js';

/** Decorative live world; no engine, input handlers, assets, or saved-state mutations. */
export function startMenuScene(canvas, { victory = false } = {}) {
  const ctx = canvas?.getContext?.('2d');
  if (!ctx) return () => {};
  const renderer = createRenderer({});
  const motion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const source = levels[0];
  // A small diorama of the real forest without instructional signs or impassable gates.
  const level = {
    ...source,
    width: 2000,
    platforms: [{ x: 0, y: 450, w: 2000, h: 90, kind: 'ground' },
      { x: 660, y: 344, w: 150, h: 24, kind: 'ledge' },
      { x: 960, y: 283, w: 125, h: 24, kind: 'ledge' }],
    signs: [], gates: [], collectibles: [], checkpoints: [], keyDoor: null,
    exit: victory ? { x: 695, y: 380 } : null,
    questionIds: [],
  };
  const player = { x: victory ? 460 : 730, y: 380, w: 40, h: 70, vx: 0, vy: 0, facing: 1, grounded: true, victory };
  let stopped = false;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  function draw(now = 0) {
    if (stopped) return;
    const reduced = Boolean(motion?.matches);
    // Freeze hidden tabs and reduced-motion dioramas. Keep the stop callback idempotent.
    if (!document.hidden && (!previous || now - previous >= 1000 / 24)) {
      if (!reduced && previous) elapsed += Math.min((now - previous) / 1000, .1);
      previous = now;
      const camera = reduced ? 35 : 35 + Math.sin(elapsed * .12) * 28;
      renderer.draw({ ctx, canvas, level, player, camera, time: reduced ? 0 : elapsed, victory,
        progress: { solved: [], keys: victory ? [0, 1, 2] : [], collected: [], checkpoint: 'start', completed: victory } });
      if (victory) {
        ctx.save();
        ctx.setTransform(canvas.width / 960, 0, 0, canvas.height / 540, 0, 0);
        const colors = ['#ffd45a', '#a9e591', '#f5f2d1'];
        for (let i = 0; i < 20; i++) {
          const x = (i * 137 + 61) % 960;
          const y = reduced ? 80 + i * 19 % 280 : (elapsed * 22 + i * 47) % 395;
          ctx.fillStyle = colors[i % colors.length];
          ctx.fillRect(x, Math.floor(y), 4, i % 2 ? 7 : 4);
        }
        ctx.restore();
      }
    }
    // One static frame is enough when reduced motion is requested. Media changes can redraw.
    if (!reduced) frame = requestAnimationFrame(draw);
  }
  function redraw() { cancelAnimationFrame(frame); previous = 0; draw(performance.now()); }
  motion?.addEventListener?.('change', redraw);
  document.addEventListener('visibilitychange', redraw);
  draw(performance.now());
  return () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    motion?.removeEventListener?.('change', redraw);
    document.removeEventListener('visibilitychange', redraw);
  };
}
