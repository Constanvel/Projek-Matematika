import { questions } from './data/questions.js';
import { levels } from './data/levels.js';
import { freshState, score, levelQuestions, levelComplete, advanceLevel, collectItem } from './state.js';
import { load, save } from './storage.js';
import { GameEngine } from './game/engine.js';
import { loadAssets } from './game/assets.js';
import { createRenderer } from './game/renderer.js';
import { showQuestion } from './ui/questions.js';
import { createPixelIcon } from './ui/pixel-icons.js';
import { GameAudio } from './game/audio.js';
import { startMenuScene } from './game/menu-scene.js';
import { loadRun, saveRun, resetRun, takeFall, getLeaderboard, recordVictory } from './game/run-records.js';

const $ = id => document.getElementById(id);
for (const [id, name] of [['start', 'play'], ['continue', 'play'], ['settings', 'settings'],
  ['game-settings', 'settings'], ['leaderboard', 'leaderboard'], ['victory-leaderboard', 'leaderboard'],
  ['victory-menu', 'home'], ['replay', 'play']]) {
  $(id).prepend(createPixelIcon(name));
  $(id).classList.add('icon-button');
}
const audio = new GameAudio();
let stopScene = startMenuScene($('menu-world'));
// Web Audio may only start after a user gesture; settings never block play.
for (const type of ['pointerdown', 'keydown']) document.addEventListener(type, () => audio.start(), { once: true });
const loaded = load();
let state = loaded.state;
let recordStorage;
try { recordStorage = window.localStorage; } catch { /* Storage can be denied. */ }
let run = state ? loadRun(recordStorage) : resetRun(recordStorage);
let measuredEngineTime = 0;
let lastRunSave = run.elapsed;
let engine = null;
let assetsPromise;
let previousFocus;
let launchId = 0;
let lastInteraction = '';
let fallNoticeUntil = 0;
let pauseRequested = false;
const modal = $('modal');
function notice(text) { $('notice').textContent = text; $('notice').hidden = !text; }
if (loaded.warning) notice(loaded.warning);
function persist() {
  if (!state) return;
  syncRunTime();
  saveRun(recordStorage, run);
  if (!save(state)) notice('Penyimpanan tidak tersedia. Game tetap berjalan, tetapi progres belum tersimpan.');
  $('continue').disabled = false;
}
function button(label, action, primary = true, icon) {
  const element = document.createElement('button');
  element.type = 'button'; element.className = `button ${primary ? 'primary' : 'secondary'}`;
  element.textContent = label;
  if (icon) { element.prepend(createPixelIcon(icon)); element.classList.add('icon-button'); }
  element.addEventListener('click', action); return element;
}
function showScreen(id) {
  stopScene?.(); stopScene = null;
  if (id === 'home') { stopScene = startMenuScene($('menu-world')); audio.setTheme('forest'); }
  if (id === 'victory') stopScene = startMenuScene($('victory-world'), { victory: true });
  document.body.dataset.screen = id;
  for (const screen of ['home', 'game', 'victory']) $(screen).hidden = screen !== id;
  window.scrollTo(0, 0);
}
function dialog(title, content = '', actions = []) {
  previousFocus = document.activeElement;
  engine?.setPaused(true);
  audio.setPaused(true);
  $('question-form').onsubmit = event => event.preventDefault();
  $('question-fields').hidden = true;
  $('dialog-kicker').textContent = 'CATATAN PETUALANGAN';
  $('dialog-title').textContent = title;
  $('dialog-content').textContent = content;
  $('dialog-actions').replaceChildren(...actions);
  if (!modal.open) modal.showModal();
}
function closeDialog() { modal.close(); }
modal.addEventListener('close', () => {
  audio.setPaused(document.hidden);
  if (!$('game').hidden && $('loading').hidden) { pauseRequested = false; engine?.setPaused(false); $('board').focus({ preventScroll: true }); }
  else previousFocus?.focus({ preventScroll: true });
});
$('close-modal').addEventListener('click', closeDialog);
function home() { launchId++; persist(); engine?.stop(); engine = null; showScreen('home'); $('continue').disabled = !state; $('start').focus(); }
function newGame() {
  const begin = () => {
    engine?.stop(); engine = null;
    state = freshState(); run = resetRun(recordStorage); measuredEngineTime = 0; lastRunSave = 0;
    persist(); closeDialog(); enterGame();
  };
  if (state) dialog('Mulai perjalanan baru?', 'Progres Gundul Warrior akan diganti. Tindakan ini tidak dapat dibatalkan. Progres Function Adventure lama tidak diubah.', [button('Ya, mulai baru', begin), button('Batalkan', closeDialog, false)]);
  else begin();
}
function syncRunTime() {
  if (!engine) return;
  // Engine time advances only through unpaused fixed physics steps.
  if (!run.completed) run.elapsed += Math.max(0, engine.time - measuredEngineTime);
  measuredEngineTime = engine.time;
}
function formatTime(seconds) {
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
function updateHud() {
  const level = levels[state.level];
  $('chapter').textContent = `GUNDUL WARRIOR / WILAYAH 0${state.level + 1}`;
  $('level-title').textContent = level.name;
  $('level-subtitle').textContent = level.subtitle;
  $('lesson').textContent = level.lesson;
  $('score').textContent = score(state);
  $('keys').textContent = state.keys.length;
  $('coins').textContent = state.collected?.length || 0;
  $('health').textContent = `${run.health}/${run.maxHealth}`;
  $('health-hearts').replaceChildren(...Array.from({ length: run.maxHealth }, (_, index) =>
    createPixelIcon(index < run.health ? 'heart-full' : 'heart-empty')));
  $('health-status').setAttribute('aria-label', `Health ${run.health} dari ${run.maxHealth}`);
  $('health-status').dataset.low = String(run.health === 1);
  const solved = levelQuestions(state.level).filter(q => state.solved.includes(q.id)).length;
  $('map-progress').textContent = `${solved} / ${level.questionIds.length} MESIN AKTIF`;
  $('checkpoint-status').textContent = `Checkpoint: ${state.checkpoint === 'start' ? 'awal wilayah' : state.checkpoint}`;
  $('mission').textContent = state.level === 2 && state.keys.length === 3 ? 'PULIHKAN INTI TERAKHIR' : 'TEMUKAN TIGA KUNCI';
}
async function enterGame() {
  if (!state) return;
  if (state.won) { victory(); return; }
  const request = ++launchId;
  syncRunTime();
  engine?.stop(); engine = null;
  measuredEngineTime = 0;
  pauseRequested = false;
  lastInteraction = '';
  showScreen('game'); updateHud();
  audio.setTheme(levels[state.level].theme);
  audio.setPaused(false);
  $('loading').hidden = false; $('retry').hidden = true;
  $('loading-text').textContent = 'Menyiapkan petualangan…';
  try {
    assetsPromise ||= loadAssets();
    const assets = await assetsPromise;
    if (request !== launchId) return;
    engine = new GameEngine({
      canvas: $('board'), level: levels[state.level], getProgress: () => state,
      draw: createRenderer(assets).draw, onInteract: interact,
      onCheckpoint: id => { state.checkpoint = id; persist(); updateHud(); },
      onFall: () => {
        syncRunTime();
        const { depleted } = takeFall(run);
        persist(); updateHud(); audio.play('fall'); lastInteraction = '';
        fallNoticeUntil = performance.now() + 2200; $('game').dataset.contextual = 'true';
        $('interaction').textContent = depleted
          ? 'Health habis. Kembali ke checkpoint dengan health penuh; progres belajar tetap aman.'
          : `Health -1. Kembali ke checkpoint; skor dan jawabanmu tetap aman. Health ${run.health}/3.`;
      },
      onFrame: updateInteraction, onPause: pause,
      onCollect: item => { if (collectItem(state, item.id)) { persist(); updateHud(); } },
      onEvent: name => audio.play(name === 'secret' ? 'key' : name === 'spring' ? 'jump' : name),
    });
    engine.respawn(state.checkpoint);
    $('loading').hidden = true; engine.start();
    if (modal.open) { engine.setPaused(true); audio.setPaused(true); }
    else if (pauseRequested || document.hidden) pause();
    else $('board').focus({ preventScroll: true });
  } catch (error) {
    if (request !== launchId) return;
    assetsPromise = null;
    $('loading-text').textContent = `Aset belum dapat dimuat. ${error.message}`;
    $('retry').hidden = false;
  }
}
function updateInteraction(frame) {
  syncRunTime();
  if (run.elapsed - lastRunSave >= 5) { saveRun(recordStorage, run); lastRunSave = run.elapsed; }
  if (frame) {
    $('board').dataset.playerX = Math.round(frame.player.x);
    $('board').dataset.playerY = Math.round(frame.player.y);
    $('board').dataset.paused = String(engine?.paused);
    $('board').dataset.grounded = String(frame.player.grounded);
    $('board').dataset.velocityY = String(Math.round(frame.player.vy));
  }
  if (!engine || modal.open) return;
  if (performance.now() < fallNoticeUntil) return;
  const item = engine.nearest();
  const route = engine.level.parkour?.find(route => engine.player.x >= route.start - 90 && engine.player.x < route.end
    && state.solved.includes(route.requiresQuestion));
  const nearbySign = engine.level.signs.find(sign => Math.abs(sign.x - engine.player.x) < 150);
  const teachingSurface = engine.level.platforms.find(platform => platform.surface && engine.player.x + engine.player.w >= platform.x - 45
    && engine.player.x <= platform.x + platform.w + 45 && Math.abs(engine.player.y + engine.player.h - platform.y) < 105);
  const surfaceHints = { spring: 'Akar pegas: tekan lompat di atas akar untuk melompat lebih tinggi.',
    ice: 'Es licin: lepaskan arah lebih awal atau tekan arah berlawanan untuk mengerem.',
    crumble: 'Batu retak: segera lanjut setelah mendarat. Pijakan pulih setelah runtuh.' };
  let text = teachingSurface ? surfaceHints[teachingSurface.surface] : route ? `Parkour: ${route.hint || 'ikuti pijakan'}. Lepaskan lalu tekan lompat lagi setelah mendarat.`
    : nearbySign ? nearbySign.text : 'Ikuti jalan. Dekati mesin bercahaya, lalu tekan E.';
  if (item?.type === 'gate') {
    const gate = item.gate || item;
    text = state.solved.includes(gate.questionId) ? `${gate.label} aktif. Tekan E untuk meninjau pembahasan.` : `${gate.label}. Tekan E untuk memulihkan mesin.`;
  } else if (item?.type === 'exit') text = state.level === 2 ? 'Peti harta ditemukan. Tekan E untuk membukanya.' : 'Wilayah selesai? Tekan E untuk melanjutkan perjalanan.';
  const contextual = Boolean(nearbySign || teachingSurface || route || (item && item.type !== 'checkpoint'));
  $('game').dataset.contextual = String(contextual);
  const signature = `${text}:${Boolean(item && item.type !== 'checkpoint')}`;
  if (signature !== lastInteraction) {
    lastInteraction = signature; $('interaction').textContent = text;
    $('interact').disabled = !item || item.type === 'checkpoint';
  }
}
function interact(item) {
  if (!state || modal.open || !engine || $('game').hidden) return;
  item ||= engine.nearest();
  if (!item) return;
  if (item.type === 'gate') {
    const gate = item.gate || item;
    const question = questions.find(q => q.id === gate.questionId);
    const previousKeys = state.keys.length;
    showQuestion({ question, gate, state, dialog, button, persist, update: () => {
      engine.rememberCheckpoint(state.checkpoint);
      engine.emit('machine', gate.x, gate.y + gate.h);
      if (state.keys.length > previousKeys) engine.emit('key', gate.x - 55, gate.y + gate.h - 90);
      updateHud();
    } });
  } else if (item.type === 'exit') {
    if (!levelComplete(state)) { dialog('Masih ada mesin yang terkunci', 'Pulihkan semua mesin wilayah ini sebelum melanjutkan.', [button('Kembali menjelajah', closeDialog)]); return; }
    if (state.level === 2) {
      advanceLevel(state); persist(); victory();
    } else {
      dialog(`${levels[state.level].name} ditaklukkan`, `Kunci ke-${state.level + 1} ditemukan. Skor: ${score(state)}. Selanjutnya: ${levels[state.level + 1].name}.`, [button('Lanjut ke wilayah berikutnya', () => {
        syncRunTime(); engine?.stop(); engine = null;
        advanceLevel(state); persist(); closeDialog(); enterGame();
      }), button('Kembali ke menu', () => { closeDialog(); home(); }, false)]);
    }
  }
}
function pause() {
  if ($('game').hidden || modal.open) return;
  pauseRequested = true;
  if (!engine) return;
  dialog('Tarik napas sebentar.', 'Perjalananmu tersimpan pada checkpoint terakhir. Semua jawaban benar tetap aman.', [button('Lanjut bermain', closeDialog, true, 'play'), button('Kembali ke checkpoint', () => { engine.respawn(state.checkpoint); closeDialog(); }, true, 'back'), button('Cara bermain', help, false), button('Pengaturan', settings, false, 'settings'), button('Menu utama', () => { closeDialog(); home(); }, false, 'home')]);
  persist();
}
function victory() {
  audio.setPaused(false);
  audio.play('victory');
  syncRunTime(); run.completed = true; saveRun(recordStorage, run);
  launchId++; engine?.stop(); engine = null; showScreen('victory');
  const firstTry = state.solved.filter(id => state.attempts[id] === 1).length;
  const wrong = Object.values(state.attempts).reduce((a, b) => a + b, 0) - state.solved.length;
  $('final-stats').replaceChildren(...[[`${score(state)}/120`, 'Skor akhir'], [`${firstTry}/12`, 'Benar percobaan pertama'], [wrong, 'Percobaan salah'], [`${state.keys.length}/3`, 'Kunci ditemukan'], [state.collected?.length || 0, 'Kristal eksplorasi'], ['12/12', 'Mesin dipulihkan'], [run.falls, 'Jumlah jatuh'], [formatTime(run.elapsed), 'Waktu bermain aktif']].map(([value, label]) => {
    const div = document.createElement('div'); div.className = 'final-stat';
    const strong = document.createElement('b'); strong.textContent = value;
    const span = document.createElement('span'); span.textContent = label; div.append(strong, span); return div;
  }));
  $('record-result').disabled = run.recorded;
  $('player-name').disabled = run.recorded;
  $('record-status').textContent = run.recorded ? 'Hasil perjalanan ini sudah dicatat.' : 'Simpan hasil tamat ke 10 besar perangkat ini.';
  $('replay').focus();
}
function leaderboard() {
  dialog('Leaderboard lokal', '', [button('Tutup', closeDialog, true, 'back')]);
  const content = $('dialog-content');
  const note = document.createElement('p'); note.className = 'leaderboard-note';
  note.textContent = '10 hasil tamat di browser ini. Urutan: skor tertinggi, jatuh tersedikit, lalu waktu aktif tercepat. Tidak tersinkron lintas perangkat.';
  const entries = getLeaderboard(recordStorage);
  if (!entries.length) {
    const empty = document.createElement('p'); empty.textContent = 'Belum ada hasil. Tuntaskan tiga wilayah lalu simpan hasilmu.';
    content.replaceChildren(note, empty); return;
  }
  const table = document.createElement('table'); table.className = 'leaderboard-table';
  const caption = document.createElement('caption'); caption.textContent = 'Peringkat petualang';
  const head = table.createTHead().insertRow();
  for (const title of ['#', 'Nama', 'Skor', 'Jatuh', 'Waktu']) {
    const th = document.createElement('th'); th.scope = 'col'; th.textContent = title; head.append(th);
  }
  const body = table.createTBody();
  entries.forEach((entry, index) => {
    const row = body.insertRow();
    for (const value of [index + 1, entry.name, entry.score, entry.falls, formatTime(entry.elapsed)]) row.insertCell().textContent = value;
    if (index < 3) row.cells[0].prepend(createPixelIcon(['gold', 'silver', 'bronze'][index]));
  });
  table.prepend(caption); content.replaceChildren(note, table);
}
$('record-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!state?.won || run.recorded) return;
  let saved = false;
  const storage = {
    getItem: key => recordStorage?.getItem(key),
    setItem: (key, value) => {
      if (!recordStorage) throw new Error('Storage unavailable');
      recordStorage.setItem(key, value); saved = true;
    },
  };
  recordVictory(storage, { score: score(state), falls: run.falls, elapsed: run.elapsed, name: $('player-name').value });
  if (!saved) { $('record-status').textContent = 'Penyimpanan tidak tersedia. Hasil belum tersimpan; coba lagi.'; return; }
  run.recorded = true; saveRun(recordStorage, run);
  $('record-result').disabled = true; $('player-name').disabled = true;
  $('record-status').textContent = 'Hasil tersimpan di leaderboard lokal.';
});
function settings() {
  const inGame = !$('game').hidden;
  dialog('Pengaturan audio', '', [button(inGame ? 'Simpan & lanjutkan' : 'Simpan & tutup', closeDialog)]);
  const content = $('dialog-content');
  const label = document.createElement('label'); label.className = 'settings-row';
  const mute = document.createElement('input'); mute.type = 'checkbox'; mute.checked = audio.settings.muted;
  let speaker = createPixelIcon(mute.checked ? 'muted' : 'speaker');
  label.classList.add('settings-mute');
  label.append(mute, speaker, document.createTextNode('Bisukan musik dan efek suara'));
  const volumeRows = [['volume', 'audio-volume', 'Volume utama'], ['musicVolume', 'music-volume', 'Musik'], ['effectsVolume', 'effects-volume', 'Efek suara']].map(([key, id, title]) => {
    const row = document.createElement('div'); row.className = 'settings-row settings-volume';
    const label = document.createElement('label'); label.htmlFor = id; label.textContent = title;
    if (key === 'musicVolume') label.prepend(createPixelIcon('music'));
    const range = document.createElement('input'); Object.assign(range, { type: 'range', id, min: '0', max: '1', step: '0.05', value: String(audio.settings[key]) });
    const output = document.createElement('output'); output.htmlFor = id;
    output.textContent = `${Math.round(Number(range.value) * 100)}%`;
    range.addEventListener('input', () => {
      audio.setSettings({ [key]: Number(range.value) });
      output.textContent = `${Math.round(Number(range.value) * 100)}%`;
    });
    row.append(label, range, output);
    return row;
  });
  mute.addEventListener('change', () => {
    audio.setSettings({ muted: mute.checked });
    const next = createPixelIcon(mute.checked ? 'muted' : 'speaker');
    speaker.replaceWith(next); speaker = next;
  });
  const note = document.createElement('p'); note.className = 'small-note'; note.textContent = 'Musik chiptune orisinal dibuat di perangkatmu. Audio berhenti saat permainan dijeda atau tab ditinggalkan.';
  content.replaceChildren(label, ...volumeRows, note);
  mute.focus();
}
$('fullscreen')?.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else notice('Browser ini tidak mendukung layar penuh. Gunakan mode landscape atau tambahkan game ke layar utama.');
  } catch { notice('Layar penuh tidak diizinkan browser. Game tetap dapat dimainkan pada seluruh viewport.'); }
});
document.addEventListener('fullscreenchange', () => {
  const toggle = $('fullscreen');
  if (toggle) {
    const label = document.fullscreenElement ? 'Keluar layar penuh' : 'Layar penuh';
    toggle.title = label; toggle.setAttribute('aria-label', label);
    toggle.setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
  }
});
$('leaderboard').addEventListener('click', leaderboard);
$('victory-leaderboard').addEventListener('click', leaderboard);
$('settings').addEventListener('click', settings);
$('game-settings').addEventListener('click', settings);
$('start').addEventListener('click', newGame);
$('replay').addEventListener('click', newGame);
$('continue').disabled = !state;
$('continue').addEventListener('click', enterGame);
$('retry').addEventListener('click', enterGame);
$('pause').addEventListener('click', pause);
$('interact').addEventListener('click', () => { if (!modal.open) interact(); });
$('victory-menu').addEventListener('click', home);
function help() {
  const inGame = !$('game').hidden;
  dialog('Bekal sang petualang', '', [button(inGame ? 'Lanjut bermain' : 'Siap berpetualang', closeDialog, true, 'play')]);
  const sections = [
    ['Bergerak dan berinteraksi', 'A/D atau panah kiri/kanan untuk berjalan. Space, W, atau panah atas untuk melompat. Tahan lompat untuk menjangkau pijakan tinggi, lepaskan lalu tekan lagi setelah mendarat. Di ponsel, tahan arah sambil menekan Lompat. Dekati mesin atau peti, lalu tekan E atau tombol Interaksi.'],
    ['Mekanik tiap wilayah', 'Akar pegas di hutan memberi dorongan saat kamu menekan lompat. Es licin di gua: lepas arah lebih awal atau tekan arah berlawanan untuk mengerem. Batu retak di kastel runtuh setelah diinjak; teruskan lompatan, lalu tunggu sampai pijakan pulih jika perlu.'],
    ['Mesin, kunci, dan checkpoint', 'Jawaban benar memulihkan mesin serta membuka gerbang atau jembatan. Tiga mesin utama tiap wilayah memberi satu kunci; tiga kunci membuka ruang harta. Pulihkan semua 12 mesin dan buka peti terakhir. Bendera serta mesin yang selesai menyimpan checkpoint. Mesin aktif dapat ditinjau lagi. Komposisi f(g(x)) berarti kerjakan g dahulu, kemudian f.'],
    ['Nyawa dan catatan perjalanan', 'Tiga hati menunjukkan sisa nyawa. Setiap jatuh mengurangi satu; saat habis, tiga nyawa pulih di checkpoint. Jawaban salah tidak mengurangi nyawa. Skor dan jawaban tetap aman ketika jatuh. Koin dan jalur rahasia bersifat opsional. Leaderboard lokal menyimpan skor, jumlah jatuh, dan waktu aktif; waktu berhenti saat jeda atau soal terbuka.'],
  ];
  const guide = document.createElement('div'); guide.className = 'play-guide';
  for (const [title, text] of sections) {
    const heading = document.createElement('h3'); heading.textContent = title;
    const paragraph = document.createElement('p'); paragraph.textContent = text;
    guide.append(heading, paragraph);
  }
  $('dialog-content').replaceChildren(guide);
}
$('help').addEventListener('click', help);
$('about').addEventListener('click', () => dialog('Gundul Warrior', 'Petualangan platformer edukasi fungsi dan komposisi fungsi. Tiga wilayah, dua belas tantangan, dan satu petualang pemberani. Karakter pixel baru mempertahankan identitas aset pengguna; sumber asli tetap disimpan. Lingkungan, animasi, musik chiptune, dan efek dibuat secara lokal dengan Canvas serta Web Audio. Tidak ada akun atau pengiriman data pemain. Statistik merupakan catatan latihan, bukan penilaian formal. Navigasi platformer memerlukan penglihatan; soal dan menu menggunakan HTML yang dapat diakses dengan keyboard.', [button('Tutup', closeDialog)]));
window.addEventListener('pagehide', persist);
window.addEventListener('blur', () => { audio.setPaused(true); persist(); pause(); });
window.addEventListener('focus', () => { if (!modal.open && $('game').hidden) audio.setPaused(false); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { audio.setPaused(true); persist(); pause(); }
  else if (!modal.open) audio.setPaused(false);
});
