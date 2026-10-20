import { checkAnswer } from './data/questions.js';
import { levels, map, spawn, gateIndex } from './data/levels.js';
import { freshState, score, walkable, completeQuestion, levelComplete, levelQuestions } from './state.js';
import { load, save } from './storage.js';
const $ = id => document.getElementById(id);
const loaded = load();
let state = loaded.state;
let activeQuestion = null;
let lastFocus = null;
let saveTimer;
let lastMove = 0;
const modal = $('modal');
function notice(text) { $('notice').textContent = text; $('notice').hidden = !text; }
if (loaded.warning) notice(loaded.warning);
function persist() {
  if (!state) return;
  if (!save(state)) notice('Penyimpanan tidak tersedia. Game tetap berjalan, tetapi progres belum tersimpan.');
  $('continue').disabled = false;
}
function showScreen(id) {
  for (const screen of ['home', 'game', 'victory']) $(screen).hidden = screen !== id;
  window.scrollTo(0, 0);
}
function showHome() { persist(); showScreen('home'); $('continue').disabled = !state; }
function button(label, action, primary = true) {
  const element = document.createElement('button');
  element.type = 'button'; element.className = `button ${primary ? 'primary' : 'secondary'}`;
  element.textContent = label; element.addEventListener('click', action); return element;
}
function closeDialog() { modal.close(); }
function openDialog(title, content = '', actions = []) {
  lastFocus = document.activeElement;
  activeQuestion = null;
  $('question-fields').hidden = true;
  $('dialog-kicker').textContent = 'CATATAN PETUALANGAN';
  $('dialog-title').textContent = title;
  $('dialog-content').textContent = content;
  $('dialog-actions').replaceChildren(...actions);
  if (!modal.open) modal.showModal();
}
modal.addEventListener('close', () => {
  activeQuestion = null;
  if (!$('game').hidden) $('board').focus({ preventScroll: true });
  else lastFocus?.focus({ preventScroll: true });
});
$('close-modal').addEventListener('click', closeDialog);
function newGame() {
  const begin = () => { clearTimeout(saveTimer); state = freshState(); persist(); closeDialog(); enterGame(); };
  if (state) openDialog('Mulai perjalanan baru?', 'Progres yang tersimpan akan diganti. Tindakan ini tidak dapat dibatalkan.', [button('Ya, mulai baru', begin), button('Batalkan', closeDialog, false)]);
  else begin();
}
$('start').addEventListener('click', newGame);
$('replay').addEventListener('click', newGame);
$('continue').disabled = !state;
$('continue').addEventListener('click', () => state?.won ? victory() : enterGame());
$('menu').addEventListener('click', showHome);
$('victory-menu').addEventListener('click', showHome);
$('help').addEventListener('click', () => openDialog('Panduan penjelajah', 'Gunakan WASD, tombol panah, atau tombol arah di layar. Dekati gerbang bernomor, lalu tekan E, Enter, atau Interaksi. Jawab soal untuk membuka jalan. Setelah tiga gerbang terbuka, dekati peti di ujung jalur dan berinteraksi untuk mendapatkan kunci. Komposisi f(g(x)) berarti kerjakan g dahulu, lalu f. Jawaban benar bernilai 10 poin sekali per soal; jawaban salah boleh dicoba lagi tanpa penalti. Progres disimpan pada browser yang sama.', [button('Mengerti', closeDialog)]));
$('about').addEventListener('click', () => openDialog('Tentang Function Adventure', 'Game edukasi untuk berlatih fungsi dan komposisi fungsi. Jelajahi Hutan Fungsi, Gua Komposisi, dan Kastel Matematika sebelum membuka Harta Fungsi. Dibuat menggunakan HTML, CSS, dan JavaScript tanpa backend. Ilustrasi dan objek permainan dibuat dengan CSS. Statistik permainan merupakan catatan latihan, bukan penilaian formal.', [button('Tutup', closeDialog)]));
function enterGame() { showScreen('game'); render(); $('board').focus({ preventScroll: true }); }
function nearby() {
  const { x, y } = state.position;
  const candidates = [[x,y],[x,y-1],[x+1,y],[x,y+1],[x-1,y]];
  for (const [cx, cy] of candidates) {
    const tile = map[cy]?.[cx];
    const index = gateIndex(tile || '');
    if (index >= 0) {
      const question = levelQuestions(state.level)[index];
      if (!state.solved.includes(question.id)) return { kind: 'gate', question };
    }
    if (tile === 'T') return { kind: 'treasure' };
  }
  return null;
}
function render() {
  const level = levels[state.level];
  $('chapter').textContent = `WILAYAH ${level.symbol} / FUNCTION WORLD`;
  $('level-title').textContent = level.name;
  $('level-subtitle').textContent = level.subtitle;
  $('lesson').textContent = level.lesson;
  $('score').innerHTML = `${score(state)} <small>/ 120</small>`;
  $('keys').innerHTML = `${state.keys.length} <small>/ 3</small>`;
  const solvedHere = levelQuestions(state.level).filter(q => state.solved.includes(q.id)).length;
  $('map-progress').textContent = `${solvedHere} / 3 GERBANG TERBUKA`;
  $('route').replaceChildren(...levels.map((item, i) => {
    const row = document.createElement('div'); row.className = `route-item${state.level === i ? ' active' : ''}`;
    row.textContent = `${i < state.level || state.won ? '✓' : item.symbol}  ${item.name}`; return row;
  }));
  $('board').className = `board ${level.theme}`;
  const tiles = [];
  map.forEach((row, y) => [...row].forEach((tile, x) => {
    const cell = document.createElement('div'); cell.className = 'tile'; cell.setAttribute('aria-hidden', 'true');
    const index = gateIndex(tile);
    if (tile === '#') cell.classList.add('wall');
    if (index >= 0) {
      const done = state.solved.includes(levelQuestions(state.level)[index].id);
      cell.classList.add(done ? 'open' : 'gate'); cell.textContent = done ? '✓' : index + 1;
    }
    if (tile === 'T') { cell.classList.add('target'); cell.textContent = '▣'; }
    if (state.position.x === x && state.position.y === y) {
      const player = document.createElement('span'); player.className = 'player'; cell.append(player);
    }
    tiles.push(cell);
  }));
  $('board').replaceChildren(...tiles);
  const interaction = nearby();
  $('interaction').textContent = interaction?.kind === 'gate' ? 'Gerbang terkunci. Selesaikan tantangan untuk membuka jalan.' : interaction?.kind === 'treasure' ? 'Peti ditemukan. Berinteraksi untuk menyelesaikan wilayah.' : `Posisi ${state.position.x}, ${state.position.y}. Ikuti jalan menuju gerbang bernomor.`;
  $('interact').disabled = !interaction;
}
const directions = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
function move(direction) {
  if (!state || $('game').hidden || modal.open) return;
  const now = performance.now(); if (now - lastMove < 110) return; lastMove = now;
  const [dx,dy] = directions[direction];
  const x = state.position.x + dx; const y = state.position.y + dy;
  if (walkable(state, x, y)) {
    state.position = { x, y }; render();
    clearTimeout(saveTimer); saveTimer = setTimeout(persist, 180);
  }
}
const keyDirections = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
document.addEventListener('keydown', event => {
  if ($('game').hidden || modal.open || /INPUT|BUTTON|TEXTAREA|SELECT/.test(event.target.tagName)) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (keyDirections[key]) { event.preventDefault(); move(keyDirections[key]); }
  if ((key === 'e' || key === 'Enter') && !event.repeat) { event.preventDefault(); interact(); }
});
document.querySelectorAll('[data-move]').forEach(control => control.addEventListener('click', () => move(control.dataset.move)));
window.addEventListener('pagehide', persist);
window.addEventListener('blur', () => { if (state) persist(); });
$('interact').addEventListener('click', interact);
function interact() {
  if (!state || modal.open || $('game').hidden) return;
  const item = nearby(); if (!item) return;
  if (item.kind === 'gate') { showQuestion(item.question); return; }
  if (!levelComplete(state)) {
    openDialog('Masih ada gerbang terkunci', 'Selesaikan tiga tantangan wilayah ini sebelum membuka peti.', [button('Kembali menjelajah', closeDialog)]); return;
  }
  if (state.level === 3) { state.won = true; persist(); victory(); return; }
  if (!state.keys.includes(state.level)) state.keys.push(state.level);
  persist(); render();
  openDialog(`${levels[state.level].name} selesai!`, `Kunci ke-${state.level + 1} berhasil ditemukan. Skor perjalananmu sekarang ${score(state)} poin. Wilayah berikutnya: ${levels[state.level + 1].name}.`, [button('Lanjut ke wilayah berikutnya', () => {
    state.level++; state.position = { ...spawn }; persist(); closeDialog(); enterGame();
  }), button('Kembali ke menu', () => { closeDialog(); showHome(); }, false)]);
}
function showQuestion(question) {
  openDialog(question.title);
  activeQuestion = question;
  $('dialog-kicker').textContent = `${levels[state.level].name.toUpperCase()} / TANTANGAN`;
  $('question-fields').hidden = false;
  $('function-def').textContent = question.functions;
  $('question-prompt').textContent = question.prompt;
  $('hint-text').textContent = question.hint; $('hint-text').hidden = true;
  $('feedback').replaceChildren(); $('feedback').className = '';
  $('check').disabled = false; $('hint').disabled = false;
  const area = $('answer-area'); area.replaceChildren();
  if (question.type === 'number') {
    const label = document.createElement('label'); label.htmlFor = 'answer'; label.textContent = 'Jawabanmu';
    const input = document.createElement('input'); input.type = 'number'; input.id = 'answer'; input.name = 'answer'; input.step = '1'; input.placeholder = 'Masukkan angka'; input.autocomplete = 'off';
    area.append(label, input); input.focus();
  } else {
    const group = document.createElement('fieldset'); group.style.border = '0'; group.style.padding = '0';
    const legend = document.createElement('legend'); legend.textContent = 'Pilih satu jawaban'; group.append(legend);
    question.options.forEach(option => {
      const label = document.createElement('label'); label.className = 'option';
      const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'answer'; radio.value = option.id;
      label.append(radio, document.createTextNode(option.label)); group.append(label);
    }); area.append(group); group.querySelector('input').focus();
  }
}
$('hint').addEventListener('click', () => { $('hint-text').hidden = !$('hint-text').hidden; });
$('question-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!activeQuestion || state.solved.includes(activeQuestion.id)) return;
  const question = activeQuestion;
  const raw = new FormData($('question-form')).get('answer');
  const correct = checkAnswer(question, raw);
  const feedback = $('feedback'); feedback.replaceChildren(); feedback.className = correct ? '' : 'error';
  const message = document.createElement('strong');
  message.textContent = correct === null ? 'Masukkan angka yang valid atau pilih satu jawaban.' : correct ? 'Benar! +10 poin. Gerbang terbuka.' : 'Belum tepat. Pelajari langkahnya, lalu coba kembali.';
  feedback.append(message);
  if (correct === null) return;
  state.attempts[question.id] = (state.attempts[question.id] || 0) + 1;
  const explanation = document.createElement('ol');
  question.explanation.forEach(step => { const li = document.createElement('li'); li.textContent = step; explanation.append(li); });
  feedback.append(explanation);
  if (correct) {
    completeQuestion(state, question.id); $('check').disabled = true;
    $('answer-area').querySelectorAll('input').forEach(input => { input.disabled = true; });
    $('dialog-actions').replaceChildren(button('Lanjut menjelajah', closeDialog)); render();
  }
  persist();
});
function victory() {
  showScreen('victory');
  const firstTry = state.solved.filter(id => state.attempts[id] === 1).length;
  const wrong = Object.values(state.attempts).reduce((a,b) => a+b, 0) - state.solved.length;
  $('final-stats').replaceChildren(...[[score(state) + '/120','Skor akhir'],[firstTry + '/12','Benar percobaan pertama'],[wrong,'Percobaan salah'],[state.keys.length + '/3','Kunci ditemukan']].map(([value,label]) => {
    const div = document.createElement('div'); div.className = 'final-stat';
    const strong = document.createElement('b'); strong.textContent = value;
    const span = document.createElement('span'); span.textContent = label; div.append(strong,span); return div;
  }));
}
