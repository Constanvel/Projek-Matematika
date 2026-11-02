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
      jumps: [{ x: 1205, landX: 1360 }, { x: 1425, landX: 1600 }], hint: 'Dua lompatan · tahan lalu lepas' },
    { id: 'forest-canopy', start: 2150, end: 2640, requiresQuestion: 'q2',
      checkpointId: 'parkour-canopy', gap: { start: 2240, end: 2600 },
      jumps: [{ x: 2195, landX: 2350 }, { x: 2415, landX: 2600 }], hint: 'Ulangi irama · dua lompatan' }],
    platforms: [ground(0, 830), ground(980, 270), ground(1600, 250), ground(2010, 230), ground(2600, 800),
      ground(240, 64, 418), ground(320, 48, 402), ledge(390, 340, 140),
      ...alcove(590, 260, 144),
      ledge(1360, 370, 100),
      ledge(2350, 370, 110),
      ground(2990, 80, 418)],
    collectibles: coins('forest', [
      [220, 400], [280, 364], [452, 310], [634, 230], [686, 230, null, true],
      [1040, 410, 'q1'], [1220, 410, 'q1'], [1415, 340, 'q1'], [1620, 410, 'q1'],
      [2070, 410, 'q2'], [2220, 410, 'q2'], [2405, 340, 'q2'], [2630, 410, 'q2'],
      [3580, 300, 'q3'], [5023, 340, 'q3'],
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
      jumps: [{ x: 1325, landX: 1460 }, { x: 1515, landX: 1680 }, { x: 1715, landX: 1920 }], hint: 'Tiga lompatan · makin tinggi' },
    { id: 'cave-ascent', start: 2400, end: 3060, requiresQuestion: 'q5',
      checkpointId: 'parkour-ascent', gap: { start: 2480, end: 3020 },
      jumps: [{ x: 2435, landX: 2570 }, { x: 2590, landX: 2770 }, { x: 2790, landX: 3020 }], hint: 'Naik bertahap · tiga lompatan' }],
    platforms: [ground(0, 940), ground(1110, 260), ground(1920, 250), ground(2320, 160), ground(3020, 680),
      ground(280, 64, 410), ledge(400, 330, 144), ...alcove(610, 250, 160),
      ledge(1460, 370, 110), ledge(1680, 330, 90),
      { ...ledge(2570, 370, 90), surface: 'ice' }, { ...ledge(2770, 330, 64), surface: 'ice' }, ground(3310, 80, 410)],
    collectibles: coins('cave', [
      [240, 402], [310, 374], [464, 300], [674, 220],
      [1170, 410, 'q4'], [1340, 410, 'q4'], [1510, 340, 'q4'],
      [1730, 300, 'q4'], [720, 220, null, true], [1930, 410, 'q4'],
      [2380, 410, 'q5'], [2450, 410, 'q5'], [2610, 340, 'q5'],
      [2800, 300, 'q5'], [3050, 410, 'q5'], [3854, 300, 'q6'], [5721, 380, 'q6'],
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
      jumps: [{ x: 1285, landX: 1420 }, { x: 1475, landX: 1660 }, { x: 1690, landX: 1830 }], hint: 'Naik lalu turun · tiga lompatan' },
    { id: 'castle-parapets', start: 2270, end: 2840, requiresQuestion: 'q8',
      checkpointId: 'parkour-parapets', gap: { start: 2350, end: 2820 },
      jumps: [{ x: 2305, landX: 2390 }, { x: 2400, landX: 2580 }, { x: 2590, landX: 2820 }], hint: 'Pijakan sempit · tiga lompatan' }],
    platforms: [ground(0, 920), ground(1080, 250), ground(1830, 200), ground(2190, 160), ground(2820, 2880),
      ground(270, 64, 418), ground(350, 64, 402), ledge(460, 322, 144), ledge(660, 242, 128),
      ledge(1420, 370, 100), ledge(1660, 410, 70),
      { ...ledge(2390, 370, 90), surface: 'crumble' }, { ...ledge(2580, 330, 100), surface: 'crumble' },
      ground(3280, 72, 418), ledge(3410, 338, 144),
      ground(3880, 72, 410), ledge(4010, 330, 144),
      ground(4610, 72, 402), ledge(4730, 322, 144),
      ground(5210, 64, 418), ledge(5320, 338, 144), ...alcove(5510, 258, 144)],
    collectibles: coins('castle', [
      [230, 402], [300, 382], [382, 366], [524, 292], [716, 212],
      [1130, 410, 'q7'], [1310, 410, 'q7'], [1480, 340, 'q7'], [1680, 380, 'q7'],
      [2240, 410, 'q8'], [2430, 340, 'q8'], [2630, 300, 'q8'], [2850, 410, 'q8'],
      [3320, 382, 'q9'], [3474, 308, 'q9'],
      [3914, 374, 'q10'], [4074, 300, 'q10'],
      [4644, 366, 'q11'], [4794, 292, 'q11'],
      [6389, 340, 'q12'], [8158, 300, 'q12'], [5550, 228, 'q12'], [5606, 228, 'q12', true],
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

// Extended finales use authored, physics-verified rhythms, not repeated identical gaps.
// Springs boost manual jumps; ice alters braking; crumble rewards a steady rhythm.
const finales = [
  { width: 5500, exit: 5390, gimmick: { id: 'spring', name: 'Akar pegas', hint: 'Lompat dari akar untuk dorongan tinggi' },
    courses: [
      { start: 3200, id: 'spring-crown', hint: 'Akar pegas · naik ke mahkota', end: 945, gap: 905,
        landings: [[169, 370, 120, 'spring'], [380, 330, 110], [688, 370, 100]], jumps: [[35, 169], [212, 380], [454, 688], [706, 905]] },
      { start: 4380, id: 'spring-descent', hint: 'Turun lalu naik · empat lompatan', end: 965, gap: 925,
        landings: [[209, 370, 100, 'spring'], [441, 410, 100], [643, 370, 90]], jumps: [[35, 209], [225, 441], [468, 643], [682, 925]] },
    ] },
  { width: 6300, exit: 6150, gimmick: { id: 'ice', name: 'Kristal licin', hint: 'Lepas arah lebih awal untuk mengerem' },
    courses: [
      { start: 3500, id: 'ice-ridge', hint: 'Kristal licin · lima lompatan', end: 1144, gap: 1104,
        landings: [[166, 370, 100, 'ice'], [354, 330, 90, 'ice'], [611, 370, 100, 'ice'], [843, 330, 90, 'ice']], jumps: [[35, 166], [216, 354], [404, 611], [679, 843], [876, 1104]] },
      { start: 4900, id: 'ice-descent', hint: 'Turun–naik · rem sebelum tepi', end: 1126, gap: 1086,
        landings: [[181, 370, 90, 'ice'], [393, 410, 100, 'ice'], [591, 370, 90, 'ice'], [821, 410, 90, 'ice']], jumps: [[35, 181], [206, 393], [429, 591], [637, 821], [854, 1086]] },
    ] },
  { width: 8900, exit: 8760, gimmick: { id: 'crumble', name: 'Batu rapuh', hint: 'Batu runtuh sesaat setelah diinjak' },
    courses: [
      { start: 5740, id: 'crumbling-tower', hint: 'Batu rapuh · terus bergerak', end: 1358, gap: 1318,
        landings: [[201, 370, 90, 'crumble'], [381, 330, 80, 'crumble'], [649, 370, 90, 'crumble'], [898, 410, 80, 'crumble'], [1048, 370, 90, 'crumble']], jumps: [[35, 201], [211, 381], [411, 649], [675, 898], [914, 1048], [1081, 1318]] },
      { start: 7340, id: 'crumbling-crown', hint: 'Enam lompatan · jangan berhenti', end: 1329, gap: 1289,
        landings: [[159, 370, 90, 'crumble'], [421, 410, 80, 'crumble'], [610, 370, 90, 'crumble'], [818, 330, 80, 'crumble'], [1044, 370, 90, 'crumble']], jumps: [[35, 159], [203, 421], [460, 610], [642, 818], [833, 1044], [1076, 1289]] },
    ] },
];
for (const [index, level] of levels.entries()) {
  const finale = finales[index];
  level.gimmick = finale.gimmick;
  // Teach the local surface over solid floor before using it over a pit.
  level.platforms.find(p => p.kind === 'ledge').surface = finale.gimmick.id;
  const lastFloor = level.platforms.find(p => p.y === 450 && p.x + p.w === level.width);
  lastFloor.w += finale.width - level.width;
  level.width = finale.width;
  level.exit.x = finale.exit;
  for (const course of finale.courses) {
    const route = { id: `${level.id}-${course.id}`, checkpointId: `parkour-${course.id}`,
      start: course.start, end: course.start + course.end, requiresQuestion: level.questionIds.at(-1),
      gap: { start: course.start + 80, end: course.start + course.gap }, hint: course.hint,
      jumps: course.jumps.map(([x, landX]) => ({ x: course.start + x, landX: course.start + landX })) };
    level.parkour.push(route);
    level.platforms = level.platforms.flatMap(p => p.y === 450 && p.x < route.gap.start && p.x + p.w > route.gap.end
      ? [ground(p.x, route.gap.start - p.x), ground(route.gap.end, p.x + p.w - route.gap.end)] : [p]);
    level.platforms.push(...course.landings.map(([x, y, w, surface]) => ({ ...ledge(course.start + x, y, w), ...(surface ? { surface } : {}) })));
  }
}

// A solved terminal is also a safe restart point, before its newly opened barrier.
for (const level of levels) {
  for (const route of level.parkour) {
    level.checkpoints.push({ id: route.checkpointId, x: route.start, y: 380, requiresQuestion: route.requiresQuestion });
    level.signs.push({ x: route.start, text: route.hint });
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
