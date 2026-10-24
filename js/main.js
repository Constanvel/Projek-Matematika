import { questions } from './data/questions.js';
import { levels } from './data/levels.js';
import { freshState, score, levelQuestions, levelComplete, advanceLevel } from './state.js';
import { load, save } from './storage.js';
import { GameEngine } from './game/engine.js';
import { loadAssets } from './game/assets.js';
import { createRenderer } from './game/renderer.js';
import { showQuestion } from './ui/questions.js';

const $ = id => document.getElementById(id);
const loaded = load();
let state = loaded.state;
let engine = null;
let assetsPromise;
let previousFocus;
let launchId = 0;
let lastInteraction = '';
let pauseRequested = false;
const modal = $('modal');
function notice(text) { $('notice').textContent = text; $('notice').hidden = !text; }
if (loaded.warning) notice(loaded.warning);
function persist() {
  if (!state) return;
  if (!save(state)) notice('Penyimpanan tidak tersedia. Game tetap berjalan, tetapi progres belum tersimpan.');
  $('continue').disabled = false;
}
function button(label, action, primary = true) {
  const element = document.createElement('button');
  element.type = 'button'; element.className = `button ${primary ? 'primary' : 'secondary'}`;
  element.textContent = label; element.addEventListener('click', action); return element;
}
function showScreen(id) {
  for (const screen of ['home', 'game', 'victory']) $(screen).hidden = screen !== id;
  window.scrollTo(0, 0);
}
function dialog(title, content = '', actions = []) {
  previousFocus = document.activeElement;
  engine?.setPaused(true);
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
  if (!$('game').hidden && $('loading').hidden) { pauseRequested = false; engine?.setPaused(false); $('board').focus({ preventScroll: true }); }
  else previousFocus?.focus({ preventScroll: true });
});
$('close-modal').addEventListener('click', closeDialog);
function home() { launchId++; persist(); engine?.stop(); engine = null; showScreen('home'); $('continue').disabled = !state; $('start').focus(); }
function newGame() {
  const begin = () => { state = freshState(); persist(); closeDialog(); enterGame(); };
  if (state) dialog('Mulai perjalanan baru?', 'Progres Gundul Warrior akan diganti. Tindakan ini tidak dapat dibatalkan. Progres Function Adventure lama tidak diubah.', [button('Ya, mulai baru', begin), button('Batalkan', closeDialog, false)]);
  else begin();
}
function updateHud() {
  const level = levels[state.level];
  $('chapter').textContent = `WILAYAH 0${state.level + 1} / DUNIA FUNGSI`;
  $('level-title').textContent = level.name;
  $('level-subtitle').textContent = level.subtitle;
  $('lesson').textContent = level.lesson;
  $('score').textContent = score(state);
  $('keys').textContent = state.keys.length;
  const solved = levelQuestions(state.level).filter(q => state.solved.includes(q.id)).length;
  $('map-progress').textContent = `${solved} / ${level.questionIds.length} MESIN AKTIF`;
  $('checkpoint-status').textContent = `Checkpoint: ${state.checkpoint === 'start' ? 'awal wilayah' : state.checkpoint}`;
  $('mission').textContent = state.level === 2 && state.keys.length === 3 ? 'PULIHKAN INTI TERAKHIR' : 'TEMUKAN TIGA KUNCI';
}
async function enterGame() {
  if (!state) return;
  if (state.won) { victory(); return; }
  const request = ++launchId;
  engine?.stop(); engine = null;
  pauseRequested = false;
  lastInteraction = '';
  showScreen('game'); updateHud();
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
      onFall: () => { lastInteraction = ''; $('interaction').textContent = 'Tidak apa-apa. Kembali ke checkpoint; skor dan jawabanmu tetap aman.'; },
      onFrame: updateInteraction, onPause: pause,
    });
    engine.respawn(state.checkpoint);
    $('loading').hidden = true; engine.start();
    if (modal.open) engine.setPaused(true);
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
  if (frame) {
    $('board').dataset.playerX = Math.round(frame.player.x);
    $('board').dataset.playerY = Math.round(frame.player.y);
    $('board').dataset.paused = String(engine?.paused);
  }
  if (!engine || modal.open) return;
  const item = engine.nearest();
  let text = 'Ikuti jalan. Dekati mesin bercahaya, lalu tekan E.';
  if (item?.type === 'gate') {
    const gate = item.gate || item;
    text = state.solved.includes(gate.questionId) ? `${gate.label} aktif. Tekan E untuk meninjau pembahasan.` : `${gate.label}. Tekan E untuk memulihkan mesin.`;
  } else if (item?.type === 'exit') text = state.level === 2 ? 'Peti harta ditemukan. Tekan E untuk membukanya.' : 'Wilayah selesai? Tekan E untuk melanjutkan perjalanan.';
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
    showQuestion({ question, gate, state, dialog, button, persist, update: () => {
      engine.rememberCheckpoint(state.checkpoint);
      updateHud();
    } });
  } else if (item.type === 'exit') {
    if (!levelComplete(state)) { dialog('Masih ada mesin yang terkunci', 'Pulihkan semua mesin wilayah ini sebelum melanjutkan.', [button('Kembali menjelajah', closeDialog)]); return; }
    if (state.level === 2) {
      advanceLevel(state); persist(); victory();
    } else {
      dialog(`${levels[state.level].name} ditaklukkan`, `Kunci ke-${state.level + 1} ditemukan. Skor: ${score(state)}. Selanjutnya: ${levels[state.level + 1].name}.`, [button('Lanjut ke wilayah berikutnya', () => {
        engine?.stop(); engine = null;
        advanceLevel(state); persist(); closeDialog(); enterGame();
      }), button('Kembali ke menu', () => { closeDialog(); home(); }, false)]);
    }
  }
}
function pause() {
  if ($('game').hidden || modal.open) return;
  pauseRequested = true;
  if (!engine) return;
  dialog('Tarik napas sebentar.', 'Perjalananmu tersimpan pada checkpoint terakhir. Semua jawaban benar tetap aman.', [button('Lanjut bermain', closeDialog), button('Kembali ke checkpoint', () => { engine.respawn(state.checkpoint); closeDialog(); }), button('Menu utama', () => { closeDialog(); home(); }, false)]);
  persist();
}
function victory() {
  launchId++; engine?.stop(); engine = null; showScreen('victory');
  const firstTry = state.solved.filter(id => state.attempts[id] === 1).length;
  const wrong = Object.values(state.attempts).reduce((a, b) => a + b, 0) - state.solved.length;
  $('final-stats').replaceChildren(...[[`${score(state)}/120`, 'Skor akhir'], [`${firstTry}/12`, 'Benar percobaan pertama'], [wrong, 'Percobaan salah'], [`${state.keys.length}/3`, 'Kunci ditemukan']].map(([value, label]) => {
    const div = document.createElement('div'); div.className = 'final-stat';
    const strong = document.createElement('b'); strong.textContent = value;
    const span = document.createElement('span'); span.textContent = label; div.append(strong, span); return div;
  }));
  $('replay').focus();
}
$('start').addEventListener('click', newGame);
$('replay').addEventListener('click', newGame);
$('continue').disabled = !state;
$('continue').addEventListener('click', enterGame);
$('retry').addEventListener('click', enterGame);
$('pause').addEventListener('click', pause);
$('interact').addEventListener('click', () => { if (!modal.open) interact(); });
$('victory-menu').addEventListener('click', home);
$('help').addEventListener('click', () => dialog('Bekal sang petualang', 'Bergerak dengan A/D atau panah kiri/kanan. Lompat dengan Space atau panah atas. Dekati mesin, lalu tekan E atau Interaksi. Pulihkan mesin melalui soal untuk membuka gerbang dan jembatan. Bendera menyimpan checkpoint. Jatuh tidak menghapus skor. Saat soal terbuka, dunia berhenti. Komposisi f(g(x)) berarti kerjakan g dahulu, kemudian f. Di ponsel, tahan tombol arah sambil menekan Lompat.', [button('Siap berpetualang', closeDialog)]));
$('about').addEventListener('click', () => dialog('Gundul Warrior', 'Petualangan platformer edukasi fungsi dan komposisi fungsi. Tiga wilayah, dua belas tantangan, dan satu petualang pemberani. Aset karakter berasal dari berkas yang disediakan pengguna. Lingkungan digambar secara lokal dengan Canvas. Tidak ada akun atau pengiriman data pemain. Statistik merupakan catatan latihan, bukan penilaian formal. Navigasi platformer memerlukan penglihatan; soal dan menu menggunakan HTML yang dapat diakses dengan keyboard.', [button('Tutup', closeDialog)]));
window.addEventListener('pagehide', persist);
window.addEventListener('blur', () => { persist(); pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { persist(); pause(); } });
