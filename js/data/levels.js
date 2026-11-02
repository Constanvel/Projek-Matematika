const ground = (x, w, y = 450) => ({ x, y, w, h: 540 - y, kind: 'ground' });
const ledge = (x, y, w) => ({ x, y, w, h: 24, kind: 'ledge' });
// Side-entry pockets leave 96 px of headroom above an optional upper landing.
const alcove = (x, y, w) => [ledge(x, y, w), ledge(x + 32, y - 120, w - 32),
  { x: x + w - 16, y: y - 96, w: 16, h: 96, kind: 'ledge' }];
// Tuple: x, y, last required question, secret. Coin progress never changes math score.
const coins = (levelId, route) => route.map(([x, y, requiresQuestion, secret = false], index) => ({
  id: `${levelId}-coin-${index + 1}`, x, y, secret,
  ...(requiresQuestion ? { requiresQuestion } : {}),
}));
const gate = (questionId, x, label, effect, bridge) => ({
  id: questionId, questionId, x, y: 0, w: 34, h: 450, label, effect, bridge,
});

// Parkour jump x is the player's top-left launch threshold while moving right.
// Hold each jump for 25 fixed steps (~0.42 s); landX identifies the next solid's left edge.
// Poll thresholds every <= 50 ms (15 px at full speed), and only trigger while grounded.
export const levels = [
  {
    id: 'forest', name: 'Hutan Fungsi', subtitle: 'Langkah kecil. Keberanian besar.',
    lesson: 'Masukkan nilai x ke fungsi, lalu hitung dengan teliti.', theme: 'forest',
    width: 3400, height: 660, spawn: { x: 80, y: 380 },
    // Keep machine bridges and saved restart floors; the middle span now requires two jumps.
    parkour: [{ id: 'forest-roots', start: 1180, end: 1640, requiresQuestion: 'q1',
      checkpointId: 'parkour-roots', gap: { start: 1250, end: 1600 },
      jumps: [{ x: 1205, landX: 1360 }, { x: 1425, landX: 1600 }] }],
    platforms: [ground(0, 830), ground(980, 270), ground(1600, 250), ground(2010, 1390),
      ground(240, 64, 418), ground(320, 48, 402), ledge(390, 340, 140),
      ...alcove(590, 260, 144),
      ledge(1360, 370, 100),
      ground(2220, 80, 410), ledge(2360, 330, 144), ledge(2570, 250, 144),
      ground(2990, 80, 418)],
    collectibles: coins('forest', [
      [220, 400], [280, 364], [452, 310], [634, 230], [686, 230, null, true],
      [1040, 410, 'q1'], [1220, 410, 'q1'], [1415, 340, 'q1'], [1620, 410, 'q1'],
      [2070, 410, 'q2'], [2260, 374, 'q2'], [2424, 300, 'q2'], [2630, 220, 'q2'],
      [3028, 382, 'q3'], [3150, 410, 'q3'],
    ]),
    gates: [
      gate('q1', 760, 'Jembatan akar', 'Jembatan akar terbentuk. Jalan ke seberang sudah terbuka.', { x: 830, y: 450, w: 150, h: 24 }),
      gate('q2', 1780, 'Jalur kanopi', 'Jalur kanopi tersambung. Teruskan perjalananmu.', { x: 1850, y: 450, w: 160, h: 24 }),
      gate('q3', 2830, 'Segel rimba', 'Segel rimba padam. Kunci pertama menunggu di ujung hutan.'),
    ],
    checkpoints: [{ id: 'start', x: 80, y: 380 }, { id: 'canopy', x: 1100, y: 380 }, { id: 'grove', x: 2130, y: 380 }],
    signs: [{ x: 180, text: 'A / D untuk berjalan' }, { x: 440, text: 'SPACE untuk melompat' }, { x: 660, text: 'Dekati mesin · tekan E' }],
    exit: { x: 3190, y: 380 }, questionIds: ['q1', 'q2', 'q3'],
  },
  {
    id: 'cave', name: 'Gua Komposisi', subtitle: 'Dua mesin. Satu urutan yang tepat.',
    lesson: '(f ∘ g)(x): kerjakan g terlebih dahulu, kemudian masukkan hasilnya ke f.', theme: 'cave',
    width: 3700, height: 660, spawn: { x: 80, y: 380 },
    parkour: [{ id: 'cave-crystals', start: 1300, end: 1960, requiresQuestion: 'q4',
      checkpointId: 'parkour-crystals', gap: { start: 1370, end: 1920 },
      jumps: [{ x: 1325, landX: 1460 }, { x: 1515, landX: 1680 }, { x: 1715, landX: 1920 }] }],
    platforms: [ground(0, 940), ground(1110, 260), ground(1920, 250), ground(2320, 1380),
      ground(280, 64, 410), ledge(400, 330, 144), ...alcove(610, 250, 160),
      ledge(1460, 370, 110), ledge(1680, 330, 90),
      ground(2540, 72, 418), ground(2630, 56, 402),
      ledge(2740, 322, 144), ledge(2940, 242, 144), ground(3310, 80, 410)],
    collectibles: coins('cave', [
      [240, 402], [310, 374], [464, 300], [674, 220],
      [1170, 410, 'q4'], [1340, 410, 'q4'], [1510, 340, 'q4'],
      [1730, 300, 'q4'], [720, 220, null, true], [1930, 410, 'q4'],
      [2380, 410, 'q5'], [2572, 382, 'q5'], [2660, 366, 'q5'],
      [2804, 292, 'q5'], [3004, 212, 'q5'], [3350, 374, 'q6'], [3450, 410, 'q6'],
    ]),
    gates: [
      gate('q4', 870, 'Rangkaian g lalu f', 'Kristal menyala: keluaran g menjadi masukan f. Jembatan pertama aktif.', { x: 940, y: 450, w: 170, h: 24 }),
      gate('q5', 2100, 'Rangkaian f lalu g', 'Urutan kedua berhasil. Jembatan kristal tersambung.', { x: 2170, y: 450, w: 150, h: 24 }),
      gate('q6', 3140, 'Segel komposisi', 'Dua urutan dapat memberi hasil berbeda. Segel gua terbuka.'),
    ],
    checkpoints: [{ id: 'start', x: 80, y: 380 }, { id: 'crystal', x: 1230, y: 380 }, { id: 'depths', x: 2440, y: 380 }],
    signs: [{ x: 260, text: 'Hasil satu mesin menjadi input mesin lain' }, { x: 1630, text: 'Perhatikan urutan fungsi!' }],
    exit: { x: 3490, y: 380 }, questionIds: ['q4', 'q5', 'q6'],
  },
  {
    id: 'castle', name: 'Kastel Matematika', subtitle: 'Pulihkan mesin. Buka harta pengetahuan.',
    lesson: 'Substitusikan seluruh bentuk fungsi. Gunakan tanda kurung saat menguadratkan.', theme: 'castle',
    width: 5700, height: 660, spawn: { x: 80, y: 380 },
    parkour: [{ id: 'castle-battlements', start: 1250, end: 1880, requiresQuestion: 'q7',
      checkpointId: 'parkour-battlements', gap: { start: 1330, end: 1830 },
      jumps: [{ x: 1285, landX: 1420 }, { x: 1475, landX: 1660 }, { x: 1690, landX: 1830 }] }],
    platforms: [ground(0, 920), ground(1080, 250), ground(1830, 200), ground(2190, 3510),
      ground(270, 64, 418), ground(350, 64, 402), ledge(460, 322, 144), ledge(660, 242, 128),
      ledge(1420, 370, 100), ledge(1660, 410, 70),
      ground(2420, 72, 402), ledge(2550, 322, 144), ledge(2750, 242, 128),
      ground(3280, 72, 418), ledge(3410, 338, 144),
      ground(3880, 72, 410), ledge(4010, 330, 144),
      ground(4610, 72, 402), ledge(4730, 322, 144),
      ground(5210, 64, 418), ledge(5320, 338, 144), ...alcove(5510, 258, 144)],
    collectibles: coins('castle', [
      [230, 402], [300, 382], [382, 366], [524, 292], [716, 212],
      [1130, 410, 'q7'], [1310, 410, 'q7'], [1480, 340, 'q7'], [1680, 380, 'q7'],
      [2240, 410, 'q8'], [2454, 366, 'q8'], [2614, 292, 'q8'], [2806, 212, 'q8'],
      [3320, 382, 'q9'], [3474, 308, 'q9'],
      [3914, 374, 'q10'], [4074, 300, 'q10'],
      [4644, 366, 'q11'], [4794, 292, 'q11'],
      [5240, 382, 'q12'], [5384, 308, 'q12'], [5550, 228, 'q12'], [5606, 228, 'q12', true],
    ]),
    gates: [
      gate('q7', 850, 'Pengunci menara', 'Pengunci pertama terbuka. Jembatan menara aktif.', { x: 920, y: 450, w: 160, h: 24 }),
      gate('q8', 1960, 'Pengunci aljabar', 'Bentuk komposisi tepat. Jalan ke ruang inti tersambung.', { x: 2030, y: 450, w: 160, h: 24 }),
      gate('q9', 2940, 'Segel kunci ketiga', 'Kunci ketiga ditemukan. Tiga kunci membuka ruang harta.'),
      gate('q10', 3660, 'Inti pertama', 'Inti pertama pulih. Teruskan ke rangkaian berikutnya.'),
      gate('q11', 4320, 'Inti kedua', 'Inti kedua menyala. Tinggal satu tantangan terakhir.'),
      gate('q12', 5010, 'Inti terakhir', 'Mesin Fungsi pulih. Harta pengetahuan kini dapat dibuka.'),
    ],
    checkpoints: [{ id: 'start', x: 80, y: 380 }, { id: 'tower', x: 1200, y: 380 },
      { id: 'hall', x: 2310, y: 380 }, { id: 'treasure', x: 3140, y: 380, requiresKeys: 3 },
      { id: 'core', x: 4500, y: 380, requiresKeys: 3 }],
    signs: [{ x: 240, text: 'Tiga kunci membuka ruang harta' }, { x: 3210, text: 'RUANG HARTA · tantangan gabungan' }],
    keyDoor: { x: 3090, y: 0, w: 30, h: 450 },
    exit: { x: 5480, y: 380 }, questionIds: ['q7', 'q8', 'q9', 'q10', 'q11', 'q12'],
  },
];

// A solved terminal is also a safe restart point, before its newly opened barrier.
for (const level of levels) {
  for (const route of level.parkour) {
    level.checkpoints.push({ id: route.checkpointId, x: route.start, y: 380, requiresQuestion: route.requiresQuestion });
    level.signs.push({ x: route.start, text: 'Simpan langkah · lompat mengikuti koin' });
  }
  for (const gate of level.gates) {
    gate.checkpointId = `machine-${gate.questionId}`;
    level.checkpoints.push({ id: gate.checkpointId, x: gate.x - 120, y: 380, requiresQuestion: gate.questionId });
  }
  level.checkpoints.sort((a, b) => a.x - b.x);
}

export const phaseFor = state => state.level === 2 && state.keys.includes(2) ? 'treasure' : 'journey';
export const levelForQuestion = id => levels.findIndex(level => level.questionIds.includes(id));
export const solidsFor = (level, state) => [
  ...level.platforms,
  ...level.gates.filter(g => !state.solved.includes(g.questionId)),
  ...level.gates.filter(g => g.bridge && state.solved.includes(g.questionId)).map(g => g.bridge),
  ...(level.keyDoor && state.keys.length < 3 ? [level.keyDoor] : []),
];
