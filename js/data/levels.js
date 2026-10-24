const ground = (x, w, y = 450) => ({ x, y, w, h: 540 - y, kind: 'ground' });
const ledge = (x, y, w) => ({ x, y, w, h: 24, kind: 'ledge' });
const gate = (questionId, x, label, effect, bridge) => ({
  id: questionId, questionId, x, y: 0, w: 34, h: 450, label, effect, bridge,
});

export const levels = [
  {
    id: 'forest', name: 'Hutan Fungsi', subtitle: 'Langkah kecil. Keberanian besar.',
    lesson: 'Masukkan nilai x ke fungsi, lalu hitung dengan teliti.', theme: 'forest',
    width: 3400, height: 660, spawn: { x: 80, y: 380 },
    platforms: [ground(0, 830), ground(980, 870), ground(2010, 1390),
      ledge(300, 365, 120), ledge(535, 320, 130), ledge(1170, 360, 145),
      ledge(1440, 305, 135), ledge(2220, 355, 150), ledge(2490, 295, 130)],
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
    platforms: [ground(0, 940), ground(1110, 1060), ground(2320, 1380),
      ledge(320, 350, 140), ledge(580, 285, 150), ledge(1290, 350, 120),
      ledge(1510, 270, 140), ledge(1770, 340, 140), ledge(2530, 340, 130), ledge(2810, 280, 160)],
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
    platforms: [ground(0, 920), ground(1080, 950), ground(2190, 3510),
      ledge(300, 355, 130), ledge(540, 285, 150), ledge(1270, 350, 150),
      ledge(1510, 280, 120), ledge(1720, 350, 130), ledge(2380, 350, 130), ledge(2600, 285, 140),
      ledge(3260, 350, 140), ledge(3910, 340, 130), ledge(4550, 345, 140)],
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
