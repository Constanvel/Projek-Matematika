import { drawPixelCharacter } from './pixel-character.js';
import { planWorldLabels } from './world-labels.js';

const labelLayouts = new WeakMap();
const labelsFor = level => {
  if (!labelLayouts.has(level)) labelLayouts.set(level, planWorldLabels(level));
  return labelLayouts.get(level);
};

const WIDTH = 960;
const HEIGHT = 540;
const PIXEL_WIDTH = 480;
const PIXEL_HEIGHT = 270;
const PALETTES = {
  forest: { sky: '#709b9a', horizon: '#c7cf9d', far: '#608b83', middle: '#39685e', near: '#254b46', trunk: '#2d3b36', soil: '#3b3335', stone: '#665247', edge: '#71984d', light: '#c7d77d', accent: '#ecc778', dark: '#182e32', shade: '#29292e' },
  cave: { sky: '#171c35', horizon: '#263249', far: '#28314f', middle: '#33445c', near: '#202b45', trunk: '#1d243b', soil: '#24263b', stone: '#45445b', edge: '#687f94', light: '#ace4d0', accent: '#64cfc4', dark: '#121b2d', shade: '#1c2033' },
  castle: { sky: '#727eaa', horizon: '#d4aba2', far: '#727b9b', middle: '#535f80', near: '#3c4765', trunk: '#333c57', soil: '#333348', stone: '#5d5c72', edge: '#97909a', light: '#e9ce98', accent: '#e8b56c', dark: '#242c43', shade: '#292b40' },
};
const noise = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const snap = v => Math.round(v / 2) * 2;
const visible = (x, width, camera, margin = 80) => x + width >= camera - margin && x <= camera + WIDTH + margin;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function box(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(snap(x), snap(y), Math.max(2, snap(w)), Math.max(2, snap(h)));
}
// Scanline polygons keep every silhouette on the same two-logical-pixel grid.
function polygon(ctx, points, color) {
  const top = snap(Math.min(...points.map(p => p[1])));
  const bottom = snap(Math.max(...points.map(p => p[1])));
  for (let y = top; y < bottom; y += 2) {
    const edges = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      if ((a[1] <= y + 1 && b[1] > y + 1) || (b[1] <= y + 1 && a[1] > y + 1)) edges.push(a[0] + (y + 1 - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
    edges.sort((a, b) => a - b);
    for (let i = 0; i + 1 < edges.length; i += 2) box(ctx, edges[i], y, edges[i + 1] - edges[i], 2, color);
  }
}
function line(ctx, x1, y1, x2, y2, color, width = 2) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2;
  for (let i = 0; i <= steps; i++) {
    const t = steps ? i / steps : 0;
    box(ctx, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, width, width, color);
  }
}
function oval(ctx, x, y, rx, ry, color) {
  for (let py = -snap(ry); py <= ry; py += 2) {
    const span = Math.sqrt(Math.max(0, 1 - (py / ry) ** 2)) * rx;
    if (span >= 1) box(ctx, x - span, y + py, span * 2, 2, color);
  }
}
function panel(ctx, x, y, w, h, color, border = '#65777a') {
  box(ctx, x + 2, y, w - 4, h, border);
  box(ctx, x, y + 2, w, h - 4, border);
  box(ctx, x + 2, y + 2, w - 4, h - 4, color);
}

// Hand-set 5 × 7 font; all labels remain pixels rather than antialiased browser text.
const FONT_DATA = {
  A:'01110100011000111111100011000110001', B:'11110100011000111110100011000111110', C:'01111100001000010000100001000001111', D:'11110100011000110001100011000111110', E:'11111100001000011110100001000011111', F:'11111100001000011110100001000010000', G:'01111100001000010111100011000101111', H:'10001100011000111111100011000110001', I:'11111001000010000100001000010011111', J:'00111000100001000010100101001001100', K:'10001100101010011000101001001010001', L:'10000100001000010000100001000011111', M:'10001110111010110101100011000110001', N:'10001110011010110011100011000110001', O:'01110100011000110001100011000101110', P:'11110100011000111110100001000010000', Q:'01110100011000110001101011001001101', R:'11110100011000111110101001001010001', S:'01111100001000001110000010000111110', T:'11111001000010000100001000010000100', U:'10001100011000110001100011000101110', V:'10001100011000110001100010101000100', W:'10001100011000110101101011101110001', X:'10001100010101000100010101000110001', Y:'10001100010101000100001000010000100', Z:'11111000010001000100010001000011111',
  '0':'01110100011001110101110011000101110', '1':'00100011000010000100001000010001110', '2':'01110100010000100010001000100011111', '3':'11110000010000101110000010000111110', '4':'00010001100101010010111110001000010', '5':'11111100001000011110000010000111110', '6':'01110100001000011110100011000101110', '7':'11111000010001000100010000100001000', '8':'01110100011000101110100011000101110', '9':'01110100011000101111000010000101110',
  '?':'01110100010000100010001000000000100', '!':'00100001000010000100001000000000100', '.':'00000000000000000000000000011000110', ':':'00000001100011000000001100011000000', '-':'00000000000000011111000000000000000', '+':'00000001000010011111001000010000000', '=':'00000000001111100000111110000000000', '/':'00001000100001000100010000100010000', '(':'00010001000100001000010000010000010', ')':'01000001000001000010000100010001000', '>':'10000010000010000010001000100010000', '<':'00001000100010001000001000001000001', '*':'00000101010111011111011101010100000', '✓':'00000000000000100010101000100000000', '·':'00000000000000000100000000000000000', '²':'01110000100010001110000000000000000', '∘':'00000000000111001010011100000000000', ',':'00000000000000000000001100010001000', '_':'00000000000000000000000000000011111', '|':'00100001000010000100001000010000100', ' ':'00000000000000000000000000000000000',
};
function normalized(value) { return String(value).toUpperCase().replace(/−/g, '-').replace(/×/g, '*').replace(/→/g, '>').replace(/[^A-Z0-9 ?!.,:+\-=\/()<>*✓·²∘_|]/g, '?'); }
function textWidth(value, size = 12) { return normalized(value).length * 6 * Math.max(1, Math.floor(size / 7)) * 2 - 2; }
function text(ctx, value, x, y, color = '#f6e4b8', size = 12, align = 'center', maxWidth = Infinity) {
  const string = normalized(value);
  let unit = Math.max(1, Math.floor(size / 7)) * 2;
  if (string.length * 6 * unit > maxWidth) unit = 2;
  const width = string.length * 6 * unit - unit;
  const start = snap(x - (align === 'center' ? width / 2 : align === 'right' ? width : 0));
  const top = snap(y - unit * 3);
  for (let i = 0; i < string.length; i++) {
    const glyph = FONT_DATA[string[i]] || FONT_DATA['?'];
    for (let p = 0; p < 35; p++) if (glyph[p] === '1') box(ctx, start + i * 6 * unit + p % 5 * unit, top + Math.floor(p / 5) * unit, unit, unit, color);
  }
}
function label(ctx, value, x, y, palette, color = palette.light) {
  const w = textWidth(value) + 18;
  panel(ctx, x - w / 2, y - 12, w, 26, palette.dark, palette.stone);
  text(ctx, value, x, y, color);
}
function sparkle(ctx, x, y, color, size = 4) {
  box(ctx, x - size, y, size * 2 + 2, 2, color);
  box(ctx, x, y - size, 2, size * 2 + 2, color);
}
function crystal(ctx, x, y, size, color, light = '#b7f3dc') {
  polygon(ctx, [[x - size * .28, y - 4], [x - size * .32, y - size * .68], [x, y - size], [x + size * .3, y - size * .7], [x + size * .25, y - 4], [x, y]], color);
  polygon(ctx, [[x, y - size + 2], [x, y - 3], [x - size * .22, y - 6], [x - size * .23, y - size * .66]], light);
  line(ctx, x + 2, y - size + 6, x + size * .18, y - size * .68, '#e1ffe3');
}
function cloud(ctx, x, y, color) {
  box(ctx, x + 18, y, 56, 6, color); box(ctx, x + 4, y + 6, 92, 10, color); box(ctx, x, y + 16, 118, 8, color); box(ctx, x + 12, y + 24, 94, 4, color);
}
function tree(ctx, x, floor, height, color, highlight, trunk) {
  const crown = floor - height;
  box(ctx, x - 8, crown + 54, 16, height - 54, trunk);
  box(ctx, x - 4, crown + 70, 4, height - 70, color);
  line(ctx, x - 4, crown + 106, x - 34, crown + 66, trunk, 6);
  line(ctx, x + 4, crown + 128, x + 32, crown + 82, trunk, 6);
  for (let tier = 0; tier < 3; tier++) {
    const y = crown + tier * 32;
    const w = 54 + tier * 20;
    polygon(ctx, [[x - w, y + 48], [x - w + 10, y + 28], [x - 28, y + 28], [x - 28, y + 10], [x - 10, y + 10], [x - 10, y], [x + 18, y], [x + 18, y + 10], [x + 36, y + 10], [x + 36, y + 26], [x + w - 10, y + 26], [x + w, y + 46]], color);
    box(ctx, x - w + 18, y + 28, 18, 4, highlight);
    box(ctx, x - 12, y + 8, 24, 4, highlight);
    box(ctx, x + 28, y + 32, 12, 4, highlight);
  }
  polygon(ctx, [[x - 8, floor - 14], [x - 20, floor], [x + 20, floor], [x + 6, floor - 14]], trunk);
}
function background(ctx, theme, p, camera, time) {
  box(ctx, 0, 0, WIDTH, HEIGHT, p.sky);
  // Flat colour bands and sparse dithering, never gradients.
  const bands = theme === 'cave' ? [p.sky, '#1c243c', '#222d43', p.horizon] : [p.sky, theme === 'forest' ? '#8eafa1' : '#9693ad', theme === 'forest' ? '#adc1a2' : '#bc9fab', p.horizon];
  bands.forEach((c, i) => box(ctx, 0, i * 108 + 38, WIDTH, 112, c));
  for (let i = 0; i < 80; i++) box(ctx, noise(i + 40) * WIDTH, 36 + Math.floor(i / 20) * 108 + (i % 2) * 4, 2, 2, bands[Math.max(0, Math.floor(i / 20) - 1)]);
  if (theme !== 'cave') {
    const sx = 756 - camera * .025;
    oval(ctx, sx, 86, 32, 32, theme === 'forest' ? '#e4dc9e' : '#f5d4ad');
    box(ctx, sx - 32, 82, 64, 4, bands[0]);
    for (let i = -1; i < 6; i++) cloud(ctx, i * 230 - camera * .07 % 230, 44 + noise(i + 7) * 86, theme === 'forest' ? '#c5d2b0' : '#d0b2b7');
    for (let layer = 0; layer < 2; layer++) {
      const offset = camera * (.12 + layer * .1), start = Math.floor(offset / 240) - 1;
      for (let i = start; i < start + 7; i++) {
        const x = i * 240 - offset, y = 160 + noise(i + layer * 11) * 70 + layer * 38;
        polygon(ctx, [[x - 50, 480], [x + 20, y + 80], [x + 70, y + 80], [x + 110, y], [x + 146, y + 32], [x + 180, y + 32], [x + 300, 480]], layer ? p.middle : p.far);
        if (!layer) polygon(ctx, [[x + 70, y + 80], [x + 110, y], [x + 146, y + 32], [x + 116, y + 26], [x + 92, y + 80]], theme === 'forest' ? '#829f8c' : '#9a91aa');
      }
    }
  }
  if (theme === 'forest') {
    for (let layer = 0; layer < 2; layer++) {
      const speed = layer ? .46 : .28, spacing = layer ? 220 : 144;
      const offset = camera * speed, start = Math.floor(offset / spacing) - 1;
      for (let i = start; i < start + 10; i++) tree(ctx, i * spacing - offset, layer ? 482 : 438, (layer ? 230 : 170) + noise(i + 33 * layer) * 100, layer ? p.near : '#49756a', layer ? '#315b4d' : '#568174', layer ? '#293f37' : '#3b655b');
    }
    // No horizontal foreground-like bands across pits: only collision tops read as paths.
  } else if (theme === 'cave') {
    for (let layer = 0; layer < 2; layer++) {
      const spacing = layer ? 180 : 116, offset = camera * (layer ? .38 : .16), start = Math.floor(offset / spacing) - 1;
      for (let i = start; i < start + 11; i++) {
        const x = i * spacing - offset, length = 54 + noise(i + layer * 31) * 130;
        polygon(ctx, [[x - 66, 0], [x + 70, 0], [x + 42, 40], [x + 18, length], [x + 2, length - 28], [x - 10, 46]], layer ? p.near : p.far);
        polygon(ctx, [[x - 76, 490], [x - 34, 386], [x - 18, 386], [x + 6, 280 + noise(i) * 92], [x + 32, 394], [x + 58, 420], [x + 80, 490]], layer ? p.near : p.middle);
        if (i % 2 === 0) crystal(ctx, x + 28, 438, 46 + noise(i) * 32, layer ? '#386f7d' : '#38536d', layer ? '#65a69e' : '#507b86');
        if (layer && i % 3 === 0) { box(ctx, x, 70, 2, 22, '#426779'); box(ctx, x, 92 + time * 28 % 210, 2, 6, '#80b6bb'); }
      }
    }
    for (let i = 0; i < 9; i++) { const x = i * 128 - camera * .11 % 128; box(ctx, x, 476, 72, 2, '#487281'); box(ctx, x + 14, 486, 42, 2, '#35556c'); }
  } else {
    const offset = camera * .32, start = Math.floor(offset / 280) - 1;
    for (let i = start; i < start + 6; i++) {
      const x = i * 280 - offset, top = 134 + noise(i) * 54;
      box(ctx, x, top, 80, 340, p.near); box(ctx, x + 80, top + 100, 200, 250, p.near);
      for (let j = 0; j < 4; j++) box(ctx, x + j * 24 - 2, top - 12, 16, 20, p.near);
      polygon(ctx, [[x - 12, top], [x + 40, top - 64], [x + 92, top]], '#3c3e5c');
      for (let y = top + 24; y < 448; y += 32) { box(ctx, x + 2, y, 76, 2, '#48516c'); box(ctx, x + ((Math.floor(y / 32) % 2) ? 22 : 52), y + 2, 2, 28, '#343e59'); }
      for (let j = 0; j < 3; j++) {
        const wx = x + 26 + j * 92, wy = top + 48 + (j ? 100 : 0);
        polygon(ctx, [[wx, wy + 40], [wx, wy + 8], [wx + 10, wy], [wx + 20, wy + 8], [wx + 20, wy + 40]], '#222e49');
        box(ctx, wx + 6, wy + 12, 8, 22, i % 2 ? '#b3947e' : '#61798c');
      }
      line(ctx, x + 40, top - 64, x + 40, top - 98, p.dark);
      polygon(ctx, [[x + 42, top - 96], [x + 72, top - 92 + Math.sin(time * 2 + i) * 2], [x + 66, top - 80], [x + 42, top - 78]], '#893e54');
      box(ctx, x + 106, top + 118, 18, 58, '#764456');
      polygon(ctx, [[x + 106, top + 176], [x + 115, top + 166], [x + 124, top + 176]], p.near);
      box(ctx, x + 112, top + 128, 6, 22, '#c49d75');
    }
  }
  // Deep scenery fills the entire camera, not a flat band below the background trees.
  // Irregular silhouettes are deliberately darker than collision tops; never add a grass edge here.
  const depthOffset = camera * .28;
  const depthStart = Math.floor(depthOffset / 96) - 1;
  for (let i = depthStart; i < depthStart + 13; i++) {
    const x = i * 96 - depthOffset, top = 476 + noise(i + 93) * 28;
    if (theme === 'forest') {
      polygon(ctx, [[x - 16, HEIGHT], [x - 8, top + 32], [x + 12, top], [x + 42, top - 10], [x + 66, top + 18], [x + 110, HEIGHT]], '#2c514b');
      line(ctx, x + 38, top + 6, x + 28, HEIGHT, '#396159', 4);
      line(ctx, x + 30, top + 32, x + 4, top + 46, '#396159', 4);
      line(ctx, x + 30, top + 38, x + 60, top + 54, '#203f3d', 6);
      box(ctx, x + 62, top + 34, 10, 4, '#476d5c');
    } else if (theme === 'cave') {
      polygon(ctx, [[x - 12, HEIGHT], [x + 8, top + 20], [x + 32, top - 18], [x + 52, top + 28], [x + 80, top + 10], [x + 112, HEIGHT]], '#202c43');
      line(ctx, x + 32, top - 10, x + 24, HEIGHT, '#30455a', 4);
      if (i % 2 === 0) crystal(ctx, x + 70, 538, 22 + noise(i) * 16, '#284d5c', '#426c78');
    } else {
      box(ctx, x, top + 8, 92, HEIGHT - top, '#303a55');
      for (let row = 0; row < 3; row++) {
        box(ctx, x + 2, top + 12 + row * 20, 88, 2, '#414963');
        box(ctx, x + (row % 2 ? 28 : 60), top + 14 + row * 20, 2, 16, '#222d45');
      }
      polygon(ctx, [[x + 18, HEIGHT], [x + 18, top + 34], [x + 28, top + 24], [x + 42, top + 24], [x + 52, top + 34], [x + 52, HEIGHT]], '#222d45');
    }
  }
  for (let i = 0; i < 24; i++) {
    const x = ((noise(i + 101) * 1100 - camera * .18 + time * (3 + noise(i) * 4)) % 1100 + 1100) % 1100 - 60;
    const y = 82 + noise(i + 51) * 338 + Math.sin(time * .6 + i) * 4;
    box(ctx, x, y, 2, 2, theme === 'cave' ? '#70aaa7' : '#d3d89c');
    if (i % 8 === 0) box(ctx, x + 4, y - 2, 2, 2, theme === 'cave' ? '#406e82' : '#94b488');
  }
}

function platform(ctx, item, theme, p, camera, bridge = false, phase = 1) {
  const { x, y, w, h } = item;
  if (!visible(x, w, camera)) return;
  if (bridge) {
    // Solid boards appear immediately to match physics; assembling sparks are decorative.
    box(ctx, x, y, w, h, p.dark);
    for (let px = x; px < x + w; px += 16) {
      box(ctx, px + 2, y + 2, Math.min(14, x + w - px - 2), h - 4, theme === 'forest' ? '#826345' : p.stone);
      box(ctx, px + 2, y, 14, 2, p.light); box(ctx, px + 4, y + 6, 2, 2, p.dark);
      if (phase < 1 && noise(px) > phase) sparkle(ctx, px + 8, y - 8 - (1 - phase) * 30, p.light);
    }
    for (const px of [x + 2, x + w - 4]) { box(ctx, px, y - 30, 4, 32, p.trunk); box(ctx, px - 2, y - 32, 8, 4, p.accent); }
    for (let i = 0; i < 12; i++) { const a = i / 12, b = (i + 1) / 12; line(ctx, x + 4 + a * (w - 8), y - 24 + Math.sin(a * Math.PI) * 14, x + 4 + b * (w - 8), y - 24 + Math.sin(b * Math.PI) * 14, p.edge); }
    return;
  }
  box(ctx, x, y, w, h, p.soil);
  const left = Math.max(x, Math.floor((camera - 32) / 32) * 32);
  for (let row = 0; row < Math.ceil(h / 24); row++) {
    const by = y + 8 + row * 24;
    for (let bx = left - (row % 2) * 16; bx < Math.min(x + w, camera + WIDTH + 32); bx += 32) {
      const sx = Math.max(x + 2, bx + 2), ex = Math.min(x + w - 2, bx + 30);
      if (ex <= sx || by >= y + h) continue;
      const bh = Math.min(20, y + h - by);
      box(ctx, sx, by, ex - sx, bh, row === 0 || theme === 'castle' ? p.stone : noise(bx + row * 9) > .5 ? '#494044' : p.soil);
      box(ctx, sx, by, ex - sx, 2, theme === 'castle' ? '#777082' : '#75604b');
      if (noise(bx + row) > .55) { box(ctx, sx + 4, by + 6, 4, 2, p.shade); box(ctx, sx + 10, by + 12, 6, 2, p.shade); }
    }
  }
  box(ctx, x, y, w, 8, p.edge); box(ctx, x + 2, y, w - 4, 2, p.light);
  box(ctx, x, y + 8, 2, h - 8, p.dark); box(ctx, x + w - 2, y + 8, 2, h - 8, p.dark);
  box(ctx, x + 2, y + h - 2, w - 4, 2, p.dark);
  for (let px = Math.max(x + 4, Math.floor(camera / 16) * 16); px < Math.min(x + w - 2, camera + WIDTH + 8); px += 16) {
    box(ctx, px, y + 6, 6, 4 + noise(px) * 6, p.edge);
    if (theme === 'forest') {
      line(ctx, px + 2, y, px, y - 6 - noise(px) * 4, p.edge); line(ctx, px + 4, y, px + 8, y - 4, p.light);
    } else box(ctx, px + 6, y + 2, 4, 2, p.light);
  }
  if (item.surface === 'spring') {
    box(ctx, x + 2, y, w - 4, 6, '#b0da78');
    for (let sx = x + 10; sx < x + w - 8; sx += 24) {
      line(ctx, sx, y + 16, sx + 6, y + 8, '#f1d788', 2);
      line(ctx, sx + 6, y + 8, sx + 12, y + 16, '#f1d788', 2);
    }
  } else if (item.surface === 'ice') {
    box(ctx, x, y, w, 8, '#9adbe6');
    box(ctx, x + 4, y, w - 8, 2, '#e5ffff');
    for (let sx = x + 12; sx < x + w - 12; sx += 28) line(ctx, sx, y + 4, sx + 10, y + 12, '#e5ffff', 2);
  } else if (item.surface === 'crumble') {
    for (let sx = x + 12; sx < x + w - 8; sx += 28) {
      line(ctx, sx, y, sx - 4, y + 8, '#292338');
      line(ctx, sx - 4, y + 8, sx + 4, y + 18, '#292338');
    }
  }
  if (item.kind === 'ledge' && theme === 'forest') {
    for (let k = 0; k < 3; k++) { const vx = x + 12 + k * 32, length = 12 + noise(x + k) * 24; line(ctx, vx, y + h, vx - 4, y + h + length, '#3b6548'); box(ctx, vx - 8, y + h + length - 8, 6, 4, '#66854c'); }
  }
}
function decorations(ctx, level, p, camera, time, surfaceStates = new Map()) {
  for (const ground of level.platforms || []) {
    if (surfaceStates.get(ground)?.state === 'gone' || ground.surface) continue;
    if (!visible(ground.x, ground.w, camera)) continue;
    const step = ground.kind === 'ground' ? 112 : 80;
    for (let i = Math.max(0, Math.floor((camera - ground.x - 80) / step)); i < Math.min(Math.floor(ground.w / step), Math.ceil((camera + WIDTH - ground.x + 80) / step)); i++) {
      const x = ground.x + i * step + 42, y = ground.y;
      if (level.theme === 'forest') {
        if (i % 3 === 0) {
          box(ctx, x - 8, y - 14, 4, 14, '#b9bd82');
          box(ctx, x - 14, y - 16, 18, 6, '#ac5960'); box(ctx, x - 10, y - 20, 10, 4, '#d47c70');
          box(ctx, x - 10, y - 16, 2, 2, '#f4cf99'); box(ctx, x, y - 14, 2, 2, '#f4cf99');
          box(ctx, x + 12, y - 8, 4, 8, '#b9bd82'); box(ctx, x + 8, y - 10, 12, 4, '#c7876b');
        } else {
          polygon(ctx, [[x - 18, y], [x - 22, y - 8], [x - 12, y - 16], [x - 4, y - 12], [x + 4, y - 20], [x + 16, y - 16], [x + 22, y - 4], [x + 16, y]], '#355b44');
          box(ctx, x - 10, y - 12, 10, 4, '#60804c'); box(ctx, x + 4, y - 16, 10, 4, '#71904e');
          if (i % 2) { box(ctx, x - 8, y - 6, 2, 2, '#d8946b'); box(ctx, x + 10, y - 10, 2, 2, '#d8946b'); }
        }
        if (i % 5 === 1) { line(ctx, x + 30, y, x + 32, y - 20, '#446f42'); sparkle(ctx, x + 32, y - 22, '#e2c77a', 2); }
      } else if (level.theme === 'cave') {
        crystal(ctx, x - 4, y, 22 + noise(i) * 16, '#478b9b', '#9cdbc4');
        crystal(ctx, x + 12, y, 16, '#626da0', '#a9acd0');
        if (i % 3 === 0) sparkle(ctx, x - 4, y - 34, '#bfe5cb', 2 + Math.floor(time + i) % 2 * 2);
      } else {
        polygon(ctx, [[x - 14, y], [x - 10, y - 10], [x + 4, y - 14], [x + 18, y - 4], [x + 18, y]], p.stone);
        box(ctx, x - 6, y - 10, 10, 2, p.edge);
        if (i % 3 === 0) {
          box(ctx, x + 8, y - 34, 4, 28, '#343047'); box(ctx, x + 4, y - 32, 12, 4, '#aa7b53');
          const flicker = Math.floor(time * 8 + i) % 3;
          polygon(ctx, [[x + 4, y - 34], [x + 2, y - 42], [x + 8, y - 52 - flicker * 2], [x + 10, y - 44], [x + 16, y - 48], [x + 18, y - 38], [x + 14, y - 32]], '#d47d4f');
          box(ctx, x + 8, y - 42, 6, 10, '#f3d78c'); box(ctx, x + 10, y - 38, 2, 6, '#ffedba');
          if (flicker) box(ctx, x + 8, y - 60, 2, 2, '#e7ab69');
        }
      }
    }
  }
}
function gate(ctx, item, solved, player, time, p, level, phase) {
  const x = item.x, bottom = item.y + item.h, width = item.w, tx = x - 66;
  // Pylons deliberately span the exact collision rectangle (including tall gates).
  box(ctx, x - 6, item.y, 6, item.h, p.dark); box(ctx, x + width, item.y, 6, item.h, p.dark);
  box(ctx, x - 4, item.y, 2, item.h, solved ? '#80b59b' : p.stone);
  box(ctx, x + width + 2, item.y, 2, item.h, solved ? '#80b59b' : p.stone);
  if (!solved || phase < 1) {
    const remaining = solved ? 1 - phase : 1;
    const fieldTop = bottom - item.h * remaining;
    box(ctx, x, fieldTop, width, bottom - fieldTop, '#315661');
    box(ctx, x + 2, fieldTop, 2, bottom - fieldTop, '#8ddcc6');
    box(ctx, x + width - 4, fieldTop, 2, bottom - fieldTop, '#64adad');
    const shift = Math.floor(time * 10) % 12 * 2;
    for (let y = Math.max(item.y, fieldTop) + shift; y < bottom; y += 24) {
      box(ctx, x + 6, y, width - 12, 2, '#6babaa');
      box(ctx, x + 10, y + 4, Math.max(2, width - 20), 2, '#467e88');
    }
    if (solved) for (let i = 0; i < 8; i++) sparkle(ctx, x + noise(i) * width, fieldTop + noise(i + 2) * 30, p.light, 2);
  }
  box(ctx, x - 8, bottom - 10, width + 16, 10, p.dark);
  box(ctx, x - 6, bottom - 10, width + 12, 2, solved ? '#a4d6aa' : p.accent);
  // Detailed function flow belongs in the paused dialog, never over jump terrain.
  // Pixel conduit links control terminal to the field, including power pulses.
  line(ctx, tx + 18, bottom - 14, x - 8, bottom - 14, p.stone, 4);
  if (solved) box(ctx, tx + 18 + (time * 28 % 30), bottom - 14, 4, 2, p.light);
  oval(ctx, tx, bottom, 26, 4, p.dark);
  panel(ctx, tx - 16, bottom - 34, 32, 34, p.stone, p.dark);
  panel(ctx, tx - 26, bottom - 74, 52, 44, p.stone, p.dark);
  box(ctx, tx - 20, bottom - 68, 40, 28, p.dark);
  box(ctx, tx - 16, bottom - 64, 32, 20, solved ? '#8ec99f' : '#dfc080');
  box(ctx, tx - 14, bottom - 62, 28, 2, solved ? '#c4ecc1' : '#f3dca6');
  text(ctx, solved ? '✓' : 'F', tx, bottom - 56, p.dark);
  for (let i = 0; i < 3; i++) box(ctx, tx - 10 + i * 8, bottom - 22, 4, 4, solved || i === Math.floor(time * 2) % 3 ? p.light : p.dark);
  box(ctx, tx - 10, bottom - 8, 20, 2, p.dark);
  const index = Number(String(item.questionId).replace(/^q/, '')) || (level.questionIds || []).indexOf(item.questionId) + 1;
  const px = player.x + player.w / 2;
  const near = Math.max(item.x - px, 0, px - item.x - item.w) <= 120 && player.y + player.h >= item.y - 140 && player.y <= bottom + 140;
  if (near) {
    label(ctx, `${index}${solved ? ' ✓' : ''}`, tx, bottom - 104, p, solved ? '#b7dca7' : '#edce97');
    // The CSS-sized interaction button supplies the verb without oversized canvas text.
  }
}
function checkpoint(ctx, item, active, locked, time, p) {
  const floor = item.y + 70, x = item.x;
  oval(ctx, x + 4, floor, 20, 4, p.dark);
  box(ctx, x - 2, floor - 72, 4, 72, '#c2b99b'); box(ctx, x + 2, floor - 70, 2, 68, p.dark);
  const wave = Math.floor(Math.sin(time * 3 + x) * 2) * 2;
  polygon(ctx, [[x + 4, floor - 68], [x + 34, floor - 66 + wave], [x + 30, floor - 54], [x + 36, floor - 44 + wave], [x + 4, floor - 46]], locked ? '#697481' : active ? '#d8ae62' : '#618f82');
  box(ctx, x + 8, floor - 64, 4, 16, locked ? '#8d9a9c' : active ? '#f4d797' : '#94b9a0');
  if (active) sparkle(ctx, x, floor - 76, p.light, 4);
  else box(ctx, x - 4, floor - 76, 8, 6, locked ? p.stone : p.accent);
}
function chest(ctx, exit, ready, player, p, time, opened = false) {
  const x = exit.x, floor = exit.y + 70;
  if (ready) {
    oval(ctx, x, floor - 16, 52, 38, '#8d754837');
    for (let i = 0; i < 5; i++) { const sy = floor - 42 - (time * 18 + i * 17) % 60; sparkle(ctx, x - 44 + i * 22, sy, i % 2 ? '#e9c57b' : '#fff0b7', 2); }
  }
  oval(ctx, x, floor, 36, 6, p.dark);
  panel(ctx, x - 30, floor - 42, 60, 42, '#76503d', '#282939');
  box(ctx, x - 26, floor - 22, 52, 16, '#9f6945');
  box(ctx, x - 24, floor - 16, 48, 2, '#b88050');
  panel(ctx, x - 30, floor - (opened ? 64 : 48), 60, 24, '#ae7c48', '#302b37');
  box(ctx, x - 24, floor - (opened ? 60 : 44), 48, 4, '#d1a364');
  for (const dx of [-20, 14]) { box(ctx, x + dx, floor - 44, 6, 40, '#dfb969'); box(ctx, x + dx, floor - 42, 2, 36, '#f3d68c'); }
  panel(ctx, x - 7, floor - 30, 14, 16, '#edce7e', '#72563e');
  box(ctx, x - 2, floor - 26, 4, 4, p.dark); box(ctx, x, floor - 22, 2, 4, p.dark);
  if (Math.abs(player.x + player.w / 2 - x) <= 140 && Math.abs(player.y - exit.y) < 160) label(ctx, 'E', x, floor - 80, p, '#ebce91');
}
function keyDoor(ctx, item, keys, p, time, phase = 1) {
  const x = item.x, bottom = item.y + item.h, open = keys >= 3;
  for (const px of [x - 14, x + item.w + 2]) {
    box(ctx, px, item.y, 12, item.h, p.dark); box(ctx, px + 2, item.y, 4, item.h, p.edge);
    for (let y = item.y; y < bottom; y += 26) box(ctx, px + 2, y, 8, 2, p.accent);
  }
  const barBottom = open ? item.y + item.h * (1 - phase) : bottom;
  if (barBottom > item.y + 2) {
    for (let px = x + 4; px < x + item.w; px += 10) { box(ctx, px, item.y, 4, barBottom - item.y - 4, '#b09a74'); polygon(ctx, [[px, barBottom - 6], [px + 4, barBottom - 6], [px + 2, barBottom]], '#d9bd87'); }
    for (let y = item.y + 20; y < barBottom; y += 42) { box(ctx, x, y, item.w, 4, '#8d785d'); box(ctx, x, y, item.w, 2, '#d4b880'); }
  }
  polygon(ctx, [[x - 24, 320], [x + item.w / 2, 286], [x + item.w + 24, 320], [x + item.w + 24, 336], [x - 24, 336]], p.stone);
  line(ctx, x - 20, 320, x + item.w / 2, 294, p.accent, 2); line(ctx, x + item.w / 2, 294, x + item.w + 20, 320, p.accent, 2);
  for (let i = 0; i < 3; i++) crystal(ctx, x + item.w / 2 + (i - 1) * 18, 330, 14, i < keys ? '#d8a866' : '#4d536b', i < keys ? '#ffe2a1' : '#697386');
  label(ctx, open ? '✓' : `${keys}/3`, x + item.w / 2, 264, p);
  if (open) for (let i = 0; i < 3; i++) sparkle(ctx, x + i * 14, 352 + (time * 20 + i * 22) % 80, p.accent, 2);
}
function collectible(ctx, item, time, p, collected) {
  if (collected) return;
  const x = item.x, y = item.y + Math.floor(Math.sin(time * 3 + item.x) * 2) * 2;
  if (item.secret) {
    // Non-solid niche: optional metadata never creates an invisible collision surface.
    const floor = item.y + 22;
    panel(ctx, x - 28, floor - 58, 56, 58, p.dark, p.stone);
    box(ctx, x - 22, floor - 52, 2, 44, p.edge); box(ctx, x + 20, floor - 52, 2, 44, p.edge);
    box(ctx, x - 26, floor - 2, 52, 4, p.accent);
    sparkle(ctx, x - 20, floor - 50, p.light, 2);
  }
  const frame = Math.floor(time * 7 + item.x) % 6;
  const width = [12, 10, 6, 4, 6, 10][frame];
  oval(ctx, x + 2, y, width / 2 + 2, 10, '#925d36');
  oval(ctx, x, y - 2, width / 2 + 2, 10, item.secret ? '#d8bf83' : '#e5b657');
  oval(ctx, x, y - 2, width / 2, 8, item.secret ? '#f7e6b3' : '#f5d781');
  box(ctx, x - Math.max(2, width / 2 - 2), y - 6, 2, 6, '#fff0b0');
  if (width >= 8) box(ctx, x, y - 4, 2, 8, '#b9853e');
  if (Math.floor(time * 3 + item.x) % 5 === 0) sparkle(ctx, x + 10, y - 12, '#fff0be', 2);
}

function newSurface(canvas) {
  if (canvas?.ownerDocument) return canvas.ownerDocument.createElement('canvas');
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(PIXEL_WIDTH, PIXEL_HEIGHT);
  if (typeof document !== 'undefined') return document.createElement('canvas');
  return null;
}

/** API-compatible renderer: physics remains 960 × 540; art is drawn at 480 × 270. */
export function createRenderer(assets) {
  // Original assets remain loaded for backward compatibility; gameplay is authored pixel art.
  void assets;
  const motion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  let surface = null, world = null, previous = null, levelId = null, lastDust = -1, landUntil = -1, victoryUntil = -1;
  let particles = [], transitions = new Map(), seenEffects = new Set();
  const burst = (x, y, time, kind, count = 14) => {
    for (let i = 0; i < count; i++) {
      const angle = noise(i + x + time) * Math.PI * 2;
      const speed = kind === 'dust' ? 18 + noise(i + y) * 40 : 30 + noise(i + y) * 110;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: -Math.abs(Math.sin(angle)) * speed - 10, born: time, life: kind === 'dust' ? .36 : .7 + noise(i) * .6, kind, color: kind === 'dust' ? '#bba77c' : ['#f5d889', '#a2d7ba', '#dc8d73', '#8eb6c9'][i % 4] });
    }
    if (particles.length > 180) particles = particles.slice(-180);
  };
  return {
    draw(frame) {
      const { ctx, canvas, level, player, camera = 0, time = 0, progress = {} } = frame;
      const p = PALETTES[level.theme] || PALETTES.forest;
      const reduced = Boolean(motion?.matches), animatedTime = reduced ? 0 : time;
      const solved = new Set(progress.solved || []), collected = new Set(progress.collected || []);
      const keys = Array.isArray(progress.keys) ? progress.keys.length : Number(progress.keys) || 0;
      if (!surface) { surface = newSurface(canvas); if (surface) { surface.width = PIXEL_WIDTH; surface.height = PIXEL_HEIGHT; world = surface.getContext('2d'); } }
      if (!world) return;
      const identity = level.id || level.theme;
      if (levelId !== identity || (previous && time < previous.time)) { levelId = identity; previous = null; particles = []; transitions = new Map(); seenEffects = new Set(); landUntil = -1; victoryUntil = -1; lastDust = -1; }
      const center = player.x + player.w / 2, feet = player.y + player.h;
      const effects = Array.isArray(frame.effects) ? frame.effects : [];
      const activeEffectTypes = new Set();
      for (const effect of effects) {
        if (!Number.isFinite(effect.x) || !Number.isFinite(effect.y)) continue;
        const born = effect.time ?? effect.born ?? time;
        if (time - born > 1.4 || born > time) continue;
        activeEffectTypes.add(effect.type);
        const id = `${effect.type}:${born}:${effect.x}:${effect.y}`;
        if (seenEffects.has(id)) continue;
        seenEffects.add(id);
        if (effect.type === 'land') landUntil = Math.max(landUntil, born + .15);
        if (effect.type === 'machine') victoryUntil = Math.max(victoryUntil, born + .8);
        if (!reduced) {
          const dust = ['dust', 'jump', 'land'].includes(effect.type);
          const count = effect.type === 'dust' ? 2 : dust ? 10 : effect.type === 'machine' || effect.type === 'secret' || effect.type === 'key' ? 24 : 12;
          burst(effect.x, effect.y, born, dust ? 'dust' : effect.type === 'coin' ? 'coin' : 'celebrate', count);
        }
      }
      if (seenEffects.size > 600) seenEffects = new Set(effects.map(effect => `${effect.type}:${effect.time ?? effect.born ?? time}:${effect.x}:${effect.y}`));
      if (Number.isFinite(player.landedAt) && time - player.landedAt >= 0 && time - player.landedAt < .15) landUntil = Math.max(landUntil, player.landedAt + .15);
      if (previous) {
        const teleported = Math.abs(player.x - previous.x) > 160 || Math.abs(player.y - previous.y) > 200;
        if (!teleported && player.grounded && !previous.grounded) { landUntil = time + .15; if (!reduced && !activeEffectTypes.has('land')) burst(center, feet - 2, time, 'dust', 12); }
        for (const id of solved) if (!previous.solved.has(id)) {
          transitions.set(id, time);
          const item = (level.gates || []).find(g => g.questionId === id);
          if (item && !reduced) { if (!activeEffectTypes.has('machine')) burst(item.x - 66, item.y + item.h - 66, time, 'celebrate', 28); victoryUntil = time + .8; }
        }
        for (const id of collected) if (!previous.collected.has(id)) {
          const item = (level.collectibles || []).find(c => c.id === id);
          if (item && !reduced && !activeEffectTypes.has('coin') && !activeEffectTypes.has('secret')) burst(item.x, item.y, time, 'coin', 10);
        }
        if (progress.checkpoint !== previous.checkpoint && progress.checkpoint) {
          const cp = (level.checkpoints || []).find(c => c.id === progress.checkpoint);
          if (cp && !reduced && !activeEffectTypes.has('checkpoint')) burst(cp.x + 10, cp.y + 10, time, 'celebrate', 14);
        }
        if (keys >= 3 && previous.keys < 3) transitions.set('keyDoor', time);
      }
      const speed = Math.abs(player.vx || 0);
      if (!reduced && !activeEffectTypes.has('dust') && player.grounded && speed > 30 && time - lastDust > (speed > 220 ? .09 : .18)) { burst(center - (player.facing === -1 ? -10 : 10), feet - 2, time, 'dust', 2); lastDust = time; }
      const phaseFor = id => reduced || !transitions.has(id) ? 1 : clamp((time - transitions.get(id)) / .65, 0, 1);
      world.save();
      try {
        world.setTransform(.5, 0, 0, .5, 0, 0);
        world.globalAlpha = 1; world.globalCompositeOperation = 'source-over'; world.imageSmoothingEnabled = false;
        background(world, level.theme, p, snap(camera), animatedTime);
        world.save();
        world.translate(-snap(camera), 0);
        const surfaceStates = new Map((frame.surfaceStates || []).map(state => [state.platform, state]));
        for (const item of level.platforms || []) {
          const state = surfaceStates.get(item);
          if (state?.state === 'gone') {
            // Thin dotted outline communicates recovery without suggesting solid support.
            for (let x = item.x; x < item.x + item.w; x += 12) box(world, x, item.y + 12, 4, 2, p.stone);
            continue;
          }
          platform(world, item, level.theme, p, camera);
          if (state?.state === 'cracking') {
            const width = Math.max(2, item.w * Math.min(1, state.remaining / .7));
            box(world, item.x, item.y - 6, item.w, 4, p.dark);
            box(world, item.x, item.y - 6, width, 4, '#efb56e');
          }
        }
        for (const item of level.gates || []) if (item.bridge && solved.has(item.questionId)) platform(world, item.bridge, level.theme, p, camera, true, phaseFor(item.questionId));
        decorations(world, level, p, camera, animatedTime, surfaceStates);
        for (const item of level.collectibles || []) if (visible(item.x - 30, 60, camera)) collectible(world, item, animatedTime, p, collected.has(item.id));
        const layout = labelsFor(level);
        // No floating blocks above the route. Signs use contextual HTML; flags mark saves.
        for (const item of layout.flags) if (visible(item.x - 70, 140, camera)) checkpoint(world, item, item.members.includes(progress.checkpoint), (item.requiresKeys || 0) > keys || Boolean(item.requiresQuestion && !solved.has(item.requiresQuestion)), animatedTime, p);
        for (const item of level.gates || []) if (visible(item.x - 250, 400, camera)) gate(world, item, solved.has(item.questionId), player, animatedTime, p, level, phaseFor(item.questionId));
        if (level.keyDoor && visible(level.keyDoor.x - 150, 330, camera)) keyDoor(world, level.keyDoor, keys, p, animatedTime, phaseFor('keyDoor'));
        if (level.exit && visible(level.exit.x - 150, 300, camera)) chest(world, level.exit, (level.questionIds || []).every(id => solved.has(id)), player, p, animatedTime, Boolean(progress.completed || frame.victory));
        let state = !player.grounded ? (player.vy < -25 ? 'jump' : 'fall') : time < landUntil ? 'land' : speed > 220 ? 'run' : speed > 12 ? 'walk' : 'idle';
        if ((frame.victory || player.victory || time < victoryUntil) && player.grounded && speed < 12) state = 'victory';
        if (player.grounded) oval(world, center, feet - 2, state === 'land' ? 22 : 16, 4, '#161f2e80');
        drawPixelCharacter(world, { x: snap(center), y: snap(feet), height: 96, time: animatedTime, facing: player.facing, state, reducedMotion: reduced });
        particles = reduced ? [] : particles.filter(particle => time - particle.born < particle.life && time >= particle.born);
        for (const particle of particles) {
          const age = time - particle.born, t = age / particle.life;
          const px = particle.x + particle.vx * age, py = particle.y + particle.vy * age + (particle.kind === 'dust' ? 25 : 100) * age * age;
          if (particle.kind === 'dust') { box(world, px, py, t < .5 ? 6 : 4, t < .5 ? 4 : 2, particle.color); }
          else if (particle.kind === 'coin' && t < .6) sparkle(world, px, py, particle.color, 2);
          else box(world, px, py, 2 + (Math.floor(t * 8) % 2) * 2, 4, particle.color);
        }
        world.restore();
        // Pit depth stays clean: no screen-space dots over terrain or HUD.
      } finally { world.restore(); }
      ctx.save();
      try {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.imageSmoothingEnabled = false;
        ctx.drawImage(surface, 0, 0, canvas.width, canvas.height);
      } finally { ctx.restore(); }
      previous = { x: player.x, y: player.y, grounded: player.grounded, solved, collected, checkpoint: progress.checkpoint, keys, time };
    },
  };
}
