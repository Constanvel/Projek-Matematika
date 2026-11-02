/** Original 32 × 48 pixel interpretation of Gundul. No source images are resampled.
 * Identity: bald warm skin, dark armour, silver brooch, oxblood split cape, heavy boots.
 * Coordinates are a foot anchor. `height` defaults to 96 logical game pixels.
 * Public menu API: drawPixelCharacter(ctx, { x, y, height, state, time, facing }).
 */
export const CHARACTER_PALETTE = Object.freeze({
  ink: '#141521', armour: '#292936', steel: '#505261', silver: '#b8bdc7', shine: '#eee6cf',
  skin: '#e9a078', skinLight: '#ffc49a', skinShadow: '#b96855', cape: '#782c40', capeLight: '#ad4050',
  capeDark: '#421e31', leather: '#684539', belt: '#aa7651', eye: '#25202b', white: '#fff1da',
});

export const CHARACTER_ANIMATIONS = Object.freeze({
  idle: { frames: 4, fps: 3 }, walk: { frames: 6, fps: 9 }, run: { frames: 6, fps: 13 },
  jump: { frames: 2, fps: 5 }, fall: { frames: 2, fps: 5 }, land: { frames: 2, fps: 12 },
  victory: { frames: 4, fps: 6 },
});
const P = CHARACTER_PALETTE;
const WALK = [[-3, 3, 0], [-2, 2, -1], [0, 0, 0], [3, -3, 0], [2, -2, -1], [0, 0, 0]];
const RUN = [[-7, 6, -2], [-4, 4, -3], [1, -1, -1], [7, -6, -2], [4, -4, -3], [-1, 1, -1]];
const rect = (ctx, x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
function shape(ctx, points, color) {
  const min = Math.min(...points.map(p => p[1]));
  const max = Math.max(...points.map(p => p[1]));
  for (let y = min; y < max; y++) {
    const intersections = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      if ((a[1] <= y + .5 && b[1] > y + .5) || (b[1] <= y + .5 && a[1] > y + .5)) {
        intersections.push(a[0] + (y + .5 - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
    }
    intersections.sort((a, b) => a - b);
    for (let i = 0; i + 1 < intersections.length; i += 2) {
      const x = Math.ceil(intersections[i] - .5), right = Math.ceil(intersections[i + 1] - .5);
      rect(ctx, x, y, right - x, 1, color);
    }
  }
}
function limb(ctx, points, width, color, edge = P.ink) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const count = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1);
    for (let j = 0; j <= count; j++) {
      const x = Math.round(a[0] + (b[0] - a[0]) * j / count);
      const y = Math.round(a[1] + (b[1] - a[1]) * j / count);
      rect(ctx, x - Math.floor(width / 2) - 1, y - 1, width + 2, width + 2, edge);
    }
    for (let j = 0; j <= count; j++) {
      const x = Math.round(a[0] + (b[0] - a[0]) * j / count);
      const y = Math.round(a[1] + (b[1] - a[1]) * j / count);
      rect(ctx, x - Math.floor(width / 2), y, width, width, color);
    }
  }
}
function boot(ctx, x, y) {
  rect(ctx, x - 3, y - 6, 7, 7, P.ink);
  rect(ctx, x - 2, y - 5, 5, 4, P.armour);
  rect(ctx, x - 2, y - 4, 4, 1, P.steel);
  rect(ctx, x - 3, y - 2, 10, 3, P.ink);
  rect(ctx, x - 2, y - 2, 7, 1, P.steel);
  rect(ctx, x - 2, y, 8, 1, '#353441');
}

export function drawPixelCharacter(ctx, options = {}) {
  const { x = 0, y = 0, height = 96, time = 0, facing = 1, reducedMotion = false } = options;
  let state = options.state || 'idle';
  if (!CHARACTER_ANIMATIONS[state]) state = 'idle';
  const animation = CHARACTER_ANIMATIONS[state];
  const frame = options.frame == null ? Math.floor((reducedMotion ? 0 : time) * animation.fps) % animation.frames : Math.abs(options.frame) % animation.frames;
  const moving = state === 'walk' || state === 'run';
  const stride = (state === 'run' ? RUN : WALK)[frame % 6];
  const airborne = state === 'jump' || state === 'fall';
  const crouch = state === 'land' ? (frame ? 2 : 5) : 0;
  const bob = moving ? stride[2] : state === 'idle' && frame === 2 ? -1 : 0;
  const lift = state === 'victory' && frame % 2 ? -2 : 0;
  const by = bob + crouch + lift;
  const lean = state === 'run' ? 3 : state === 'jump' ? 2 : 0;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y));
  const scale = height / 48;
  ctx.scale((facing === -1 || facing === 'left' ? -1 : 1) * scale, scale);
  // Trailing silhouette and two split cape tails; gait changes their shape, not their scale.
  const flutter = moving ? frame % 3 * 2 : frame % 2;
  const trail = state === 'run' || airborne ? 9 : 0;
  shape(ctx, [[-8 + lean, -31 + by], [-13 - trail, -13 + by], [-14 - trail, -2 - flutter + by], [-7, -7 + by], [-5, -2 + by], [5, -7 + by], [9, -2 + by], [10, -28 + by]], P.ink);
  shape(ctx, [[-7 + lean, -29 + by], [-11 - trail, -13 + by], [-12 - trail, -5 - flutter + by], [-7, -10 + by], [-5, -5 + by], [3, -10 + by], [7, -5 + by], [7, -28 + by]], P.cape);
  shape(ctx, [[-7, -27 + by], [-10 - trail, -12 + by], [-10 - trail, -8 - flutter + by], [-7, -13 + by], [-3, -27 + by]], P.capeLight);
  rect(ctx, 4, -25 + by, 3, 16, P.capeDark);
  let backFoot = moving ? stride[0] : -4;
  let frontFoot = moving ? stride[1] : 4;
  let backY = 0, frontY = 0;
  if (state === 'jump') { backFoot = -7; frontFoot = 7; backY = -7 - frame; frontY = -11; }
  if (state === 'fall') { backFoot = -5; frontFoot = 6; backY = -3; frontY = -1; }
  if (state === 'run') { backY = frame < 3 ? -3 : -7; frontY = frame < 3 ? -7 : -3; }
  limb(ctx, [[-3, -17 + by], [-5 + Math.round(backFoot / 2), -10 + crouch], [backFoot, backY - 5]], 4, '#332c35');
  boot(ctx, backFoot, backY);
  limb(ctx, [[3, -17 + by], [3 + Math.round(frontFoot / 2), -10 + crouch], [frontFoot, frontY - 5]], 4, P.armour);
  rect(ctx, 2 + Math.round(frontFoot / 2), -10 + crouch, 4, 2, P.steel);
  boot(ctx, frontFoot, frontY);
  // Back arm sits behind chest plate.
  let backHand = [-8 - (moving ? Math.round(stride[1] / 2) : 0), -18 + by];
  let frontHand = [9 + (moving ? Math.round(stride[0] / 2) : 0), -18 + by];
  if (state === 'jump') { backHand = [-10, -29]; frontHand = [11, -33]; }
  if (state === 'fall') { backHand = [-11, -26]; frontHand = [12, -25]; }
  if (state === 'land') { backHand = [-10, -14]; frontHand = [11, -13]; }
  if (state === 'victory') { backHand = [-10, -38 - frame % 2 * 2]; frontHand = [12, -41 + frame % 2 * 3]; }
  if (state === 'run') frontHand[1] -= 7;
  limb(ctx, [[-6 + lean, -29 + by], [-9, -24 + by], backHand], 4, P.armour);
  rect(ctx, backHand[0] - 1, backHand[1] + 1, 3, 3, P.skin);
  shape(ctx, [[-7 + lean, -31 + by], [6 + lean, -31 + by], [7, -22 + by], [8, -13 + by], [1, -16 + by], [-6, -13 + by], [-7, -24 + by]], P.ink);
  shape(ctx, [[-5 + lean, -29 + by], [4 + lean, -29 + by], [4, -22 + by], [6, -16 + by], [1, -18 + by], [-4, -16 + by]], P.armour);
  rect(ctx, -4 + lean, -27 + by, 2, 8, P.steel);
  rect(ctx, 1 + lean, -28 + by, 1, 9, P.leather);
  rect(ctx, -6, -20 + by, 13, 3, P.leather);
  rect(ctx, -1, -20 + by, 4, 3, P.silver);
  rect(ctx, 0, -19 + by, 2, 1, P.ink);
  // Silver shoulder studs, red collar, diamond clasp.
  rect(ctx, -8 + lean, -31 + by, 7, 4, P.steel);
  rect(ctx, -7 + lean, -31 + by, 4, 1, P.silver);
  shape(ctx, [[-5 + lean, -33 + by], [5 + lean, -33 + by], [2 + lean, -28 + by]], P.capeLight);
  rect(ctx, lean - 1, -31 + by, 3, 3, P.silver);
  rect(ctx, lean, -32 + by, 1, 5, P.shine);
  rect(ctx, lean - 2, -30 + by, 5, 1, P.shine);
  rect(ctx, lean, -30 + by, 1, 1, P.ink);
  limb(ctx, [[7 + lean, -29 + by], [9 + lean, -24 + by], frontHand], 4, P.armour);
  rect(ctx, frontHand[0] - 1, frontHand[1], 3, 3, P.skinLight);
  rect(ctx, frontHand[0] - 2, frontHand[1] + 3, 5, 3, P.ink);
  rect(ctx, frontHand[0] - 1, frontHand[1] + 3, 4, 1, P.steel);
  // Three-quarter face: eyes sit in the upper half, separated from nose and mouth.
  const hx = lean - 7, hy = -48 + by;
  shape(ctx, [[hx + 3, hy], [hx + 11, hy], [hx + 14, hy + 3], [hx + 14, hy + 9], [hx + 15, hy + 10], [hx + 14, hy + 12], [hx + 12, hy + 16], [hx + 4, hy + 16], [hx + 1, hy + 13], [hx, hy + 5], [hx + 1, hy + 2]], P.ink);
  shape(ctx, [[hx + 3, hy + 1], [hx + 10, hy + 1], [hx + 13, hy + 3], [hx + 13, hy + 9], [hx + 14, hy + 10], [hx + 13, hy + 12], [hx + 11, hy + 15], [hx + 4, hy + 15], [hx + 2, hy + 12], [hx + 1, hy + 5]], P.skin);
  shape(ctx, [[hx + 3, hy + 2], [hx + 10, hy + 2], [hx + 12, hy + 4], [hx + 12, hy + 6], [hx + 4, hy + 6], [hx + 2, hy + 9], [hx + 2, hy + 5]], P.skinLight);
  rect(ctx, hx + 1, hy + 9, 2, 3, P.skinShadow);
  rect(ctx, hx + 2, hy + 10, 1, 1, P.skinLight);
  // Two individual brows and compact dark eyes preserve Gundul's original expression.
  rect(ctx, hx + 4, hy + 5, 3, 1, P.eye);
  rect(ctx, hx + 9, hy + 5, 3, 1, P.eye);
  if (!(state === 'idle' && frame === 3)) {
    rect(ctx, hx + 4, hy + 7, 3, 3, P.eye);
    rect(ctx, hx + 9, hy + 7, 3, 3, P.eye);
    rect(ctx, hx + 4, hy + 7, 1, 1, P.white);
    rect(ctx, hx + 9, hy + 7, 1, 1, P.white);
    rect(ctx, hx + 5, hy + 9, 1, 1, P.skinShadow);
    rect(ctx, hx + 10, hy + 9, 1, 1, P.skinShadow);
  } else {
    rect(ctx, hx + 4, hy + 8, 3, 1, P.eye);
    rect(ctx, hx + 9, hy + 8, 3, 1, P.eye);
  }
  rect(ctx, hx + 8, hy + 10, 1, 2, P.skinShadow);
  rect(ctx, hx + 9, hy + 11, 1, 1, P.skinLight);
  rect(ctx, hx + 7, hy + 13, 3, 1, P.skinShadow);
  if (state === 'victory') { rect(ctx, hx + 6, hy + 12, 1, 1, P.skinShadow); rect(ctx, hx + 10, hy + 12, 1, 1, P.skinShadow); }
  ctx.restore();
}
