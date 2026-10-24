import { getMachineFlow } from '../data/machines.js';

const WIDTH = 960;
const HEIGHT = 540;
const PALETTES = {
  forest: {
    sky: '#d7e9df', horizon: '#f3edce', far: '#a6c6b7', middle: '#719b89',
    near: '#3d7260', trunk: '#456052', soil: '#304d43', stone: '#476454',
    edge: '#84aa69', light: '#cee29a', accent: '#e7c77b', dark: '#203b35',
  },
  cave: {
    sky: '#1b253b', horizon: '#34435a', far: '#34435d', middle: '#42516c',
    near: '#28364f', trunk: '#253049', soil: '#252d43', stone: '#49536a',
    edge: '#778ca5', light: '#a4e7df', accent: '#8ddbd7', dark: '#192338',
  },
  castle: {
    sky: '#d9dce4', horizon: '#f2e6d2', far: '#b2b5c5', middle: '#8c93ab',
    near: '#626f89', trunk: '#515d77', soil: '#3e485f', stone: '#65718a',
    edge: '#a5a8ae', light: '#e9d6a0', accent: '#e4bd6e', dark: '#2b344a',
  },
};

const noise = n => {
  const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};
const visible = (x, width, camera, margin = 80) => x + width >= camera - margin && x <= camera + WIDTH + margin;

function polygon(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
}

function rounded(ctx, x, y, w, h, radius, color) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function line(ctx, points, color, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.stroke();
}

function text(ctx, value, x, y, color = '#f8f5e8', size = 13, align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px "Trebuchet MS", Arial, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function crystal(ctx, x, y, size, color) {
  polygon(ctx, [[x, y], [x - size * 0.32, y - size * 0.7], [x, y - size],
    [x + size * 0.27, y - size * 0.72], [x + size * 0.3, y - size * 0.15]], color);
  polygon(ctx, [[x, y], [x, y - size], [x + size * 0.27, y - size * 0.72],
    [x + size * 0.3, y - size * 0.15]], '#ffffff25');
}

function tree(ctx, x, floor, height, palette, distant = false) {
  const crown = floor - height * 0.7;
  const color = distant ? palette.middle : palette.near;
  polygon(ctx, [[x - 10, floor], [x - 5, crown], [x + 4, crown - 15],
    [x + 9, floor]], distant ? palette.middle : palette.trunk);
  line(ctx, [[x, crown + 25], [x - height * 0.17, crown - 8]], color, 7);
  ellipse(ctx, x - height * 0.16, crown, height * 0.25, height * 0.2, color);
  ellipse(ctx, x + height * 0.15, crown - 6, height * 0.26, height * 0.22, color);
  ellipse(ctx, x, crown - height * 0.14, height * 0.3, height * 0.25, color);
  if (!distant) ellipse(ctx, x - height * 0.1, crown - height * 0.19, height * 0.18, height * 0.12, '#ffffff09');
}

function background(ctx, theme, palette, camera, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, palette.sky);
  sky.addColorStop(1, palette.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (theme !== 'cave') {
    ellipse(ctx, 755 - camera * 0.025, 96, 43, 43, '#fff5dba0');
    for (let i = -1; i < 5; i++) {
      const x = i * 310 - (camera * 0.08 % 310);
      ellipse(ctx, x + 80, 90 + noise(i + 30) * 70, 95, 15, '#ffffff35');
      ellipse(ctx, x + 120, 84 + noise(i + 30) * 70, 55, 20, '#ffffff25');
    }
    for (let layer = 0; layer < 2; layer++) {
      const spacing = 270;
      const offset = camera * (0.12 + layer * 0.1);
      const start = Math.floor(offset / spacing) - 1;
      for (let i = start; i <= start + 6; i++) {
        const x = i * spacing - offset;
        const peak = 165 + noise(i + layer * 21) * 120 + layer * 55;
        polygon(ctx, [[x - 60, 470], [x + 135, peak], [x + 360, 470]], layer ? palette.middle : palette.far);
      }
    }
  }

  if (theme === 'forest') {
    for (let layer = 0; layer < 2; layer++) {
      const speed = layer ? 0.46 : 0.28;
      const spacing = layer ? 235 : 140;
      const offset = camera * speed;
      const start = Math.floor(offset / spacing) - 1;
      for (let i = start; i <= start + Math.ceil(WIDTH / spacing) + 2; i++) {
        const height = (layer ? 230 : 160) + noise(i + layer * 33) * 100;
        ctx.globalAlpha = layer ? 0.48 : 0.55;
        tree(ctx, i * spacing - offset, layer ? 465 : 435, height, palette, !layer);
      }
    }
    ctx.globalAlpha = 1;
    ellipse(ctx, 460, 465, 720, 44, '#e5edce27');
  } else if (theme === 'cave') {
    for (let layer = 0; layer < 2; layer++) {
      const spacing = layer ? 175 : 120;
      const offset = camera * (layer ? 0.35 : 0.16);
      const start = Math.floor(offset / spacing) - 1;
      for (let i = start; i < start + 11; i++) {
        const x = i * spacing - offset;
        const length = 60 + noise(i + layer * 13) * 150;
        polygon(ctx, [[x - 55, 0], [x + 60, 0], [x + 20, length]], layer ? palette.near : palette.far);
        polygon(ctx, [[x - 65, 490], [x + 10, 300 + noise(i) * 100], [x + 75, 490]], layer ? palette.near : palette.middle);
        if (i % 2 === 0) {
          ctx.globalAlpha = 0.35;
          crystal(ctx, x + 20, 438, 55 + noise(i + 10) * 50, palette.accent);
          ctx.globalAlpha = 1;
        }
      }
    }
    const glow = ctx.createRadialGradient(550, 300, 5, 550, 300, 300);
    glow.addColorStop(0, '#83d2ce16');
    glow.addColorStop(1, '#83d2ce00');
    ctx.fillStyle = glow;
    ctx.fillRect(200, 0, 700, HEIGHT);
  } else {
    const offset = camera * 0.32;
    const start = Math.floor(offset / 300) - 1;
    for (let i = start; i <= start + 5; i++) {
      const x = i * 300 - offset;
      const top = 140 + noise(i) * 50;
      ctx.fillStyle = palette.near;
      ctx.fillRect(x, top, 78, 320);
      ctx.fillRect(x + 78, top + 90, 225, 230);
      for (let k = 0; k < 4; k++) ctx.fillRect(x + k * 23 - 3, top - 12, 15, 20);
      polygon(ctx, [[x - 12, top], [x + 39, top - 65], [x + 90, top]], palette.trunk);
      rounded(ctx, x + 28, top + 32, 20, 41, 10, '#d9d7bc50');
      rounded(ctx, x + 135, top + 130, 26, 65, 13, '#33435a');
      rounded(ctx, x + 228, top + 130, 26, 65, 13, '#33435a');
      line(ctx, [[x + 39, top - 65], [x + 39, top - 105]], palette.trunk, 3);
      polygon(ctx, [[x + 40, top - 105], [x + 76, top - 98], [x + 40, top - 85]], '#976565');
    }
    ctx.fillStyle = '#ece7dc15';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // Deterministic motes stay quiet; reduced-motion freezes them rather than hiding context.
  for (let i = 0; i < 22; i++) {
    const x = ((noise(i + 101) * 1250 - camera * 0.18 + time * (3 + noise(i) * 4)) % 1100 + 1100) % 1100 - 70;
    const y = 80 + noise(i + 51) * 320 + Math.sin(time * 0.6 + i) * 5;
    ellipse(ctx, x, y, i % 4 ? 1.4 : 2.2, i % 4 ? 1.4 : 2.2, theme === 'cave' ? '#b4eee84a' : '#fff7d56a');
  }
}

function platform(ctx, item, theme, palette, camera, bridge = false) {
  const { x, y, w, h } = item;
  if (!visible(x, w, camera)) return;
  if (bridge) {
    ctx.fillStyle = theme === 'forest' ? '#7e6748' : palette.stone;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = palette.light;
    ctx.fillRect(x, y, w, 4);
    for (let px = x + 5; px < x + w; px += 18) {
      line(ctx, [[px, y + 5], [px, y + h - 2]], '#172e3650', 2);
    }
    line(ctx, [[x + 4, y], [x + 4, y - 34]], palette.edge, 4);
    line(ctx, [[x + w - 4, y], [x + w - 4, y - 34]], palette.edge, 4);
    ctx.strokeStyle = palette.edge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 4, y - 28);
    ctx.quadraticCurveTo(x + w / 2, y - 5, x + w - 4, y - 28);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = palette.soil;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = palette.stone;
  ctx.fillRect(x, y + 8, w, item.kind === 'ledge' ? h - 8 : 20);
  if (theme === 'castle') {
    const left = Math.max(x, Math.floor(camera / 64) * 64 - 64);
    for (let row = 0; row < Math.ceil(h / 27); row++) {
      const by = y + 12 + row * 27;
      line(ctx, [[Math.max(x, camera - 5), by], [Math.min(x + w, camera + WIDTH + 5), by]], '#25354a60', 2);
      for (let bx = left - (row % 2) * 32; bx < Math.min(x + w, camera + WIDTH + 64); bx += 64) {
        if (bx >= x) line(ctx, [[bx, by], [bx, Math.min(by + 27, y + h)]], '#25354a60', 2);
      }
    }
  } else {
    const first = Math.max(0, Math.floor((camera - x - 30) / 38));
    const last = Math.min(Math.ceil(w / 38), Math.ceil((camera + WIDTH - x + 30) / 38));
    for (let i = first; i < last; i++) {
      const px = x + i * 38 + 5;
      polygon(ctx, [[px, y + 38], [px + 14, y + 32], [px + 26, y + 43], [px + 10, y + 54]], '#ffffff0b');
    }
  }
  ctx.fillStyle = palette.edge;
  ctx.fillRect(x, y, w, 7);
  ctx.fillStyle = palette.light;
  ctx.fillRect(x, y, w, 2);
  if (theme === 'forest') {
    const start = Math.max(0, Math.floor((camera - x - 15) / 19));
    const end = Math.min(Math.floor(w / 19), Math.ceil((camera + WIDTH - x + 15) / 19));
    for (let i = start; i < end; i++) {
      const px = x + i * 19 + 8;
      polygon(ctx, [[px - 3, y + 3], [px - 5, y - 5 - noise(i) * 5], [px + 1, y - 1],
        [px + 5, y - 7], [px + 4, y + 3]], palette.edge);
    }
    if (item.kind === 'ledge') {
      line(ctx, [[x + 18, y + h], [x + 20, y + h + 24], [x + 27, y + h + 35]], palette.near, 3);
    }
  }
}

function prompt(ctx, x, y, caption, palette) {
  rounded(ctx, x - 14, y - 14, 28, 28, 8, '#f5efd9');
  text(ctx, 'E', x, y, palette.dark, 15);
  if (caption) text(ctx, caption, x, y + 27, palette.light, 12);
}

function caveMachines(ctx, questionId, solved, tx, bottom, palette) {
  const flow = getMachineFlow(questionId, solved);
  if (!flow.paths.length || !flow.paths.every(path => path.steps.length === 2)) return;
  // Reserve the space above the terminal label and E prompt; nothing here is interactive.
  const left = tx - 156;
  const top = bottom - (flow.paths.length === 2 ? 312 : 240);
  const height = flow.paths.length === 2 ? 142 : 70;
  rounded(ctx, left, top, 312, height, 8, '#192338ed');
  flow.paths.forEach((path, index) => {
    const y = top + 40 + index * 58;
    text(ctx, path.label, tx, y - 26, palette.light, 11);
    text(ctx, solved ? String(path.input) : 'INPUT', left + 23, y, palette.light, 10);
    path.steps.forEach((step, stepIndex) => {
      const x = left + 55 + stepIndex * 108;
      const start = stepIndex ? x - 56 : x - 17;
      line(ctx, [[start, y], [x - 5, y]], palette.accent, 2);
      polygon(ctx, [[x - 5, y - 4], [x, y], [x - 5, y + 4]], palette.accent);
      rounded(ctx, x, y - 15, 48, 30, 5, palette.stone);
      rounded(ctx, x + 4, y - 11, 40, 22, 3, solved ? '#91c7a4' : '#e2c98b');
      text(ctx, step.name, x + 24, y, palette.dark, 17);
      if (solved && stepIndex === 0) text(ctx, String(step.output), x + 77, y - 10, palette.light, 12);
    });
    const end = left + 211;
    line(ctx, [[end, y], [end + 35, y]], palette.accent, 2);
    polygon(ctx, [[end + 31, y - 4], [end + 36, y], [end + 31, y + 4]], palette.accent);
    text(ctx, solved ? String(path.output) : 'OUTPUT', left + 278, y, palette.light, 10);
  });
  if (flow.summary) text(ctx, solved ? flow.summary : 'DUA URUTAN · SELISIH HASIL', tx, top + height - 12, palette.light, 11);
}

function gate(ctx, item, solved, player, time, palette, level) {
  const x = item.x;
  const bottom = item.y + item.h;
  const width = item.w;
  // The tall force field is separate from its waist-high control terminal.
  if (!solved) {
    ctx.fillStyle = '#74d9cc24';
    ctx.fillRect(x, item.y, width, item.h);
    ctx.fillStyle = '#8ee8d386';
    ctx.fillRect(x, item.y, 3, item.h);
    ctx.fillRect(x + width - 3, item.y, 3, item.h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, item.y, width, item.h);
    ctx.clip();
    const shift = time * 15 % 38;
    for (let y = item.y - 45; y < bottom + 45; y += 38) {
      line(ctx, [[x, y + shift], [x + width, y + shift - 19]], '#a9f5df65', 2);
    }
    ctx.restore();
    rounded(ctx, x - 5, bottom - 10, width + 10, 10, 2, palette.dark);
    ctx.fillStyle = '#a1e5cb';
    ctx.fillRect(x - 2, bottom - 10, width + 4, 3);
  } else {
    ctx.save();
    ctx.globalAlpha = 0.3;
    line(ctx, [[x - 2, bottom], [x - 2, 327], [x + width / 2, 309], [x + width + 2, 327], [x + width + 2, bottom]], palette.light, 2);
    ctx.restore();
  }
  const tx = x - 55;
  if (level.theme === 'cave') caveMachines(ctx, item.questionId, solved, tx, bottom, palette);
  ellipse(ctx, tx, bottom - 1, 27, 6, '#102d3130');
  rounded(ctx, tx - 19, bottom - 28, 38, 28, 3, palette.dark);
  rounded(ctx, tx - 24, bottom - 67, 48, 43, 6, palette.stone);
  rounded(ctx, tx - 20, bottom - 64, 40, 31, 4, palette.dark);
  rounded(ctx, tx - 16, bottom - 60, 32, 22, 3, solved ? '#91c7a4' : '#e2c98b');
  const terminalText = level.theme === 'cave' ? (solved ? '✓' : 'E') : (solved ? 'f ✓' : 'f(x)');
  text(ctx, terminalText, tx, bottom - 49, palette.dark, 13);
  ctx.fillStyle = palette.accent;
  ctx.fillRect(tx - 11, bottom - 19, 22, 3);
  const index = Number(String(item.questionId).replace(/^q/, ''))
    || (level.questionIds || []).indexOf(item.questionId) + 1;
  const label = solved ? `MESIN ${index} · PULIH` : `MESIN ${index}`;
  rounded(ctx, tx - 60, bottom - 103, 120, 24, 6, palette.dark);
  text(ctx, label, tx, bottom - 91, solved ? '#aedbc1' : '#f0dfb4', 12);
  const px = player.x + player.w / 2;
  const near = Math.max(item.x - px, 0, px - item.x - item.w) <= 120
    && player.y + player.h >= item.y - 140 && player.y <= bottom + 140;
  if (near) prompt(ctx, tx, bottom - 130, solved ? 'Tinjau mesin' : 'Aktifkan mesin', palette);
}

function checkpoint(ctx, item, active, locked, time, palette) {
  const floor = item.y + 70;
  ellipse(ctx, item.x + 4, floor, 20, 4, '#122f3429');
  line(ctx, [[item.x, floor], [item.x, floor - 68]], palette.dark, 4);
  const wave = Math.sin(time * 2 + item.x) * 3;
  polygon(ctx, [[item.x + 2, floor - 67], [item.x + 35, floor - 61 + wave],
    [item.x + 27, floor - 49 + wave], [item.x + 2, floor - 46]], locked ? '#78818a' : active ? '#e8c77e' : '#7aa99a');
  ellipse(ctx, item.x, floor - 69, 4, 4, active ? palette.accent : palette.light);
  if (active) {
    rounded(ctx, item.x - 34, floor - 94, 68, 20, 5, palette.dark);
    text(ctx, 'TERSIMPAN', item.x, floor - 84, palette.light, 10);
  }
}

function sign(ctx, item, palette) {
  const x = item.x;
  ctx.font = '600 12px "Trebuchet MS", Arial, sans-serif';
  const width = Math.min(324, ctx.measureText(item.text).width + 24);
  line(ctx, [[x, 450], [x, 408]], palette.trunk, 5);
  rounded(ctx, x - width / 2, 390, width, 29, 5, palette.dark);
  ctx.fillStyle = palette.accent;
  ctx.fillRect(x - width / 2, 396, 3, 17);
  text(ctx, item.text, x, 405, '#e4eadc', 12);
}

function chest(ctx, exit, ready, player, palette, time) {
  const x = exit.x;
  const floor = exit.y + 70;
  if (ready) {
    const glow = ctx.createRadialGradient(x, floor - 30, 10, x, floor - 30, 85);
    glow.addColorStop(0, '#f5d78a45');
    glow.addColorStop(1, '#f5d78a00');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 85, floor - 115, 170, 170);
  }
  ellipse(ctx, x, floor, 36, 7, '#122f343a');
  rounded(ctx, x - 29, floor - 47, 58, 46, 8, '#a47c4e');
  rounded(ctx, x - 29, floor - 47, 58, 23, 9, '#c3a064');
  ctx.fillStyle = '#604f3e';
  ctx.fillRect(x - 29, floor - 26, 58, 3);
  ctx.fillStyle = palette.accent;
  ctx.fillRect(x - 20, floor - 45, 7, 43);
  ctx.fillRect(x + 13, floor - 45, 7, 43);
  rounded(ctx, x - 7, floor - 30, 14, 17, 3, '#edcf84');
  ellipse(ctx, x, floor - 23, 2.5, 3, palette.dark);
  rounded(ctx, x - 55, floor - 80, 110, 23, 6, palette.dark);
  text(ctx, 'PETI PENGETAHUAN', x, floor - 68, '#eddfb9', 10);
  if (ready) {
    for (let i = 0; i < 4; i++) {
      const sy = floor - 58 - (time * 12 + i * 17) % 45;
      ellipse(ctx, x - 29 + i * 19, sy, 1.5, 1.5, '#f5dfa7');
    }
  }
  if (Math.abs(player.x + player.w / 2 - x) <= 140 && Math.abs(player.y - exit.y) < 160) {
    prompt(ctx, x, floor - 110, ready ? 'Buka peti' : 'Pulihkan semua mesin', palette);
  }
}

function keyDoor(ctx, item, keys, palette, time) {
  const x = item.x;
  const bottom = item.y + item.h;
  const open = keys >= 3;
  // A full-height portcullis matches the collision rectangle, not a small floor prop.
  ctx.fillStyle = palette.dark;
  ctx.fillRect(x - 13, 0, 12, bottom);
  ctx.fillRect(x + item.w + 1, 0, 12, bottom);
  ctx.fillStyle = palette.accent;
  ctx.fillRect(x - 11, 0, 3, bottom);
  ctx.fillRect(x + item.w + 8, 0, 3, bottom);
  if (!open) {
    ctx.fillStyle = '#334259d9';
    ctx.fillRect(x, 0, item.w, bottom);
    for (let px = x + 4; px < x + item.w; px += 10) line(ctx, [[px, 0], [px, bottom]], '#c0ab7c', 3);
    for (let y = 20; y < bottom; y += 43) line(ctx, [[x, y], [x + item.w, y]], '#b49b68', 3);
  }
  polygon(ctx, [[x - 22, 320], [x + item.w / 2, 288], [x + item.w + 22, 320],
    [x + item.w + 22, 334], [x - 22, 334]], palette.stone);
  line(ctx, [[x - 18, 322], [x + item.w / 2, 298], [x + item.w + 18, 322]], palette.accent, 3);
  for (let i = 0; i < 3; i++) {
    const dx = x + item.w / 2 + (i - 1) * 18;
    crystal(ctx, dx, 326, 13, i < keys ? '#edd392' : '#596579');
  }
  rounded(ctx, x - 61, 254, item.w + 122, 25, 6, palette.dark);
  text(ctx, open ? 'RUANG HARTA TERBUKA' : `GERBANG HARTA · ${keys}/3 KUNCI`, x + item.w / 2, 267, palette.light, 12);
  if (open) {
    ctx.globalAlpha = 0.25 + Math.sin(time) * 0.05;
    ctx.fillStyle = palette.light;
    ctx.fillRect(x, 334, item.w, bottom - 334);
    ctx.globalAlpha = 1;
  }
}

function decorations(ctx, level, palette, camera, time) {
  for (const ground of level.platforms || []) {
    if (ground.kind !== 'ground' || !visible(ground.x, ground.w, camera)) continue;
    const start = Math.max(0, Math.floor((camera - ground.x - 80) / 135));
    const end = Math.min(Math.floor(ground.w / 135), Math.ceil((camera + WIDTH - ground.x + 80) / 135));
    for (let i = start; i < end; i++) {
      const x = ground.x + i * 135 + 55;
      const y = ground.y;
      if (level.theme === 'forest') {
        ellipse(ctx, x - 5, y - 4, 18, 9, palette.near);
        ellipse(ctx, x + 10, y - 5, 16, 12, '#678b62');
        if (i % 3 === 1) {
          line(ctx, [[x + 23, y], [x + 25, y - 16]], palette.near, 2);
          ellipse(ctx, x + 25, y - 16, 3, 3, palette.accent);
        }
      } else if (level.theme === 'cave') {
        crystal(ctx, x, y, 20 + noise(i) * 15, i % 2 ? '#74a6bc' : '#87b8b0');
        crystal(ctx, x + 14, y, 14, '#7c90af');
      } else {
        polygon(ctx, [[x - 13, y], [x - 8, y - 10], [x + 8, y - 13], [x + 18, y]], palette.stone);
        if (i % 4 === 0) {
          line(ctx, [[x, y - 10], [x, y - 33]], palette.dark, 4);
          ellipse(ctx, x, y - 38, 6, 10 + Math.sin(time * 4) * 1.5, '#e4b977');
          ellipse(ctx, x, y - 36, 3, 6, '#fae3a2');
        }
      }
    }
  }
}

function character(ctx, assets, player, time, reduced) {
  const speed = Math.abs(player.vx);
  const left = player.facing === -1 || player.facing === 'left';
  const moving = speed > 12;
  const stepping = player.grounded && moving;
  const stride = Math.floor(time * (speed > 220 ? 9 : 6)) % 2;
  let pose = left ? 'posturkiri' : 'posturkanan';
  let mirror = false;
  if (!player.grounded || moving) {
    pose = reduced ? 'posturberjalan' : stride ? 'posturberlari' : 'posturberjalan';
    mirror = left;
  }
  const image = assets[pose] || assets.posturdepan;
  if (!image) return;
  const feet = player.y + player.h;
  const center = player.x + player.w / 2;
  if (player.grounded) ellipse(ctx, center, feet - 1, 19, 4, '#15232d40');
  const scale = 96 / 544;
  // Tiny anchored squash supplies a gait without sliding the normalized foot anchor.
  const bob = stepping && !reduced ? Math.sin(time * 15) * 0.012 : 0;
  ctx.save();
  ctx.translate(center, feet);
  ctx.scale(mirror ? -1 : 1, 1 + bob);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, -224 * scale, -528 * scale, 448 * scale, 544 * scale);
  ctx.restore();
}

/** All world coordinates are logical pixels; the caller's context state is preserved. */
export function createRenderer(assets) {
  const motion = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  return {
    draw({ ctx, canvas, level, player, camera = 0, time = 0, progress = {} }) {
      const palette = PALETTES[level.theme] || PALETTES.forest;
      const reduced = Boolean(motion?.matches);
      const animatedTime = reduced ? 0 : time;
      const solved = new Set(progress.solved || []);
      const keys = Array.isArray(progress.keys) ? progress.keys.length : Number(progress.keys) || 0;
      ctx.save();
      try {
        ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.imageSmoothingEnabled = true;
        ctx.setLineDash([]);
        background(ctx, level.theme, palette, camera, animatedTime);
        ctx.save();
        try {
          ctx.translate(-camera, 0);
          for (const item of level.platforms || []) platform(ctx, item, level.theme, palette, camera);
          for (const item of level.gates || []) {
            if (item.bridge && solved.has(item.questionId)) platform(ctx, item.bridge, level.theme, palette, camera, true);
          }
          decorations(ctx, level, palette, camera, animatedTime);
          for (const item of level.signs || []) {
            if (visible(item.x - 170, 340, camera)) sign(ctx, item, palette);
          }
          for (const item of level.checkpoints || []) {
            if (visible(item.x - 40, 80, camera)) {
              checkpoint(ctx, item, progress.checkpoint === item.id, (item.requiresKeys || 0) > keys || Boolean(item.requiresQuestion && !solved.has(item.requiresQuestion)), animatedTime, palette);
            }
          }
          for (const item of level.gates || []) {
            if (visible(item.x - 220, 340, camera)) gate(ctx, item, solved.has(item.questionId), player, animatedTime, palette, level);
          }
          if (level.keyDoor && visible(level.keyDoor.x - 100, 230, camera)) {
            keyDoor(ctx, level.keyDoor, keys, palette, animatedTime);
          }
          if (level.exit && visible(level.exit.x - 140, 280, camera)) {
            chest(ctx, level.exit, (level.questionIds || []).every(id => solved.has(id)), player, palette, animatedTime);
          }
          character(ctx, assets, player, time, reduced);
        } finally {
          ctx.restore();
        }
        // A shallow lower vignette gives pits depth without obscuring the playable floor.
        const shade = ctx.createLinearGradient(0, 490, 0, HEIGHT);
        shade.addColorStop(0, '#111c2c00');
        shade.addColorStop(1, '#111c2c24');
        ctx.fillStyle = shade;
        ctx.fillRect(0, 490, WIDTH, 50);
      } finally {
        ctx.restore();
      }
    },
  };
}
