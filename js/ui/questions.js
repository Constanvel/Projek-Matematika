import { checkAnswer } from '../data/questions.js';
import { getMachineFlow } from '../data/machines.js';
import { completeQuestion } from '../state.js';

export function showQuestion({ question, gate, state, dialog, button, persist, update }) {
  const $ = id => document.getElementById(id);
  const review = state.solved.includes(question.id);
  dialog(question.title);
  $('dialog-kicker').textContent = `${gate.label.toUpperCase()} / ${review ? 'TINJAU PEMBAHASAN' : 'TANTANGAN'}`;
  $('question-fields').hidden = false;
  $('function-def').textContent = question.functions;
  $('question-prompt').textContent = question.prompt;
  $('hint-text').textContent = question.hint;
  $('hint-text').hidden = true;
  $('feedback').replaceChildren();
  $('feedback').className = '';
  $('check').disabled = review;
  $('hint').onclick = () => { $('hint-text').hidden = !$('hint-text').hidden; };
  const flow = $('machine-flow');
  function renderFlow(solved) {
    flow.replaceChildren();
    const model = getMachineFlow(question.id, solved);
    const rows = model.paths.length ? model.paths : [{ tokens: model.labels }];
    rows.forEach(path => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;flex-basis:100%';
      if (path.label) {
        const label = document.createElement('strong'); label.textContent = `${path.label}:`; row.append(label);
      }
      path.tokens.forEach((value, i) => {
        if (i) row.append(document.createTextNode(' → '));
        const node = document.createElement('span'); node.textContent = value; row.append(node);
      });
      flow.append(row);
    });
    if (model.summary) {
      const summary = document.createElement('strong'); summary.textContent = model.summary; flow.append(summary);
    }
  }
  renderFlow(review);
  const area = $('answer-area'); area.replaceChildren();
  if (question.type === 'number') {
    const label = document.createElement('label'); label.htmlFor = 'answer'; label.textContent = 'Jawabanmu';
    const input = document.createElement('input'); Object.assign(input, { type: 'number', id: 'answer', name: 'answer', step: '1', placeholder: 'Masukkan angka', autocomplete: 'off', disabled: review });
    area.append(label, input);
  } else {
    const group = document.createElement('fieldset'); group.style.cssText = 'border:0;padding:0;margin:0';
    const legend = document.createElement('legend'); legend.textContent = 'Pilih satu jawaban'; group.append(legend);
    for (const option of question.options) {
      const label = document.createElement('label'); label.className = 'option';
      const radio = document.createElement('input'); Object.assign(radio, { type: 'radio', name: 'answer', value: option.id, disabled: review });
      label.append(radio, document.createTextNode(option.label)); group.append(label);
    }
    area.append(group);
  }
  function explanation(message, correct) {
    const feedback = $('feedback'); feedback.replaceChildren(); feedback.className = correct ? '' : 'error';
    const heading = document.createElement('strong'); heading.textContent = message;
    const list = document.createElement('ol');
    question.explanation.forEach(step => { const li = document.createElement('li'); li.textContent = step; list.append(li); });
    feedback.append(heading, list);
  }
  if (review) {
    explanation('Mesin ini sudah aktif. Pelajari kembali langkahnya.', true);
    $('dialog-actions').replaceChildren(button('Kembali menjelajah', () => $('modal').close()));
  }
  $('question-form').onsubmit = event => {
    event.preventDefault();
    if (state.solved.includes(question.id)) return;
    const raw = new FormData($('question-form')).get('answer');
    const correct = checkAnswer(question, raw);
    if (correct === null) { $('feedback').textContent = 'Masukkan angka yang valid atau pilih satu jawaban.'; $('feedback').className = 'error'; return; }
    state.attempts[question.id] = (state.attempts[question.id] || 0) + 1;
    explanation(correct ? `Benar! +10 poin. ${gate.effect}` : 'Belum tepat. Pelajari langkahnya, lalu coba kembali.', correct);
    if (correct) {
      completeQuestion(state, question.id);
      renderFlow(true);
      $('check').disabled = true;
      area.querySelectorAll('input').forEach(input => { input.disabled = true; });
      $('dialog-actions').replaceChildren(button('Lanjut menjelajah', () => $('modal').close()));
      update();
    }
    persist();
  };
  area.querySelector('input:not(:disabled)')?.focus();
}
