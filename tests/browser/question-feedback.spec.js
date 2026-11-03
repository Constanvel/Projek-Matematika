import { test, expect } from '@playwright/test';

test('wrong answers give clues without worked solutions for all original and randomized questions', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(async () => {
    const { showQuestion } = await import('/js/ui/questions.js');
    const { questionsForState } = await import('/js/data/question-runs.js');
    const { freshState, completeQuestion, advanceLevel, score } = await import('/js/state.js');
    const { levels } = await import('/js/data/levels.js');
    const $ = id => document.getElementById(id);
    const dialog = title => {
      $('dialog-title').textContent = title;
      $('dialog-content').replaceChildren(); $('dialog-actions').replaceChildren();
      if (!$('modal').open) $('modal').showModal();
    };
    const button = (label, action) => {
      const element = document.createElement('button'); element.type = 'button';
      element.textContent = label; element.addEventListener('click', action); return element;
    };
    const answer = (question, value) => {
      if (question.type === 'number') $('answer').value = value;
      else document.querySelector(`#answer-area input[value="${value}"]`).checked = true;
      $('question-form').requestSubmit();
    };
    const results = [];
    for (const randomized of [false, true]) {
      const initial = randomized ? { ...freshState(), questionSeed: 12345, questionSetVersion: 1 } : freshState();
      for (const question of questionsForState(initial)) {
        const state = structuredClone(initial);
        let gate;
        setup: for (const level of levels) {
          for (const candidate of level.gates) {
            if (candidate.questionId === question.id) { gate = candidate; break setup; }
            state.attempts[candidate.questionId] = 1; completeQuestion(state, candidate.questionId);
          }
          advanceLevel(state);
        }
        const options = { question, gate, state, dialog, button,
          persist: () => localStorage.setItem('feedback-test-progress', JSON.stringify(state)), update: () => {} };
        showQuestion(options);
        const before = { solved: [...state.solved], keys: [...state.keys], score: score(state), flow: $('machine-flow').textContent };
        const wrong = question.type === 'number' ? String(question.answer + 1)
          : question.options.find(option => option.id !== question.answer).id;
        let clueOnly = true;
        for (let attempt = 1; attempt <= 3; attempt++) {
          answer(question, wrong);
          clueOnly &&= !$('hint-text').hidden && $('hint-text').textContent === question.hint
            && !$('feedback').querySelector('ol, li')
            && !question.explanation.some(step => $('feedback').textContent.includes(step))
            && $('machine-flow').textContent === before.flow
            && !$('check').disabled && state.attempts[question.id] === attempt;
        }
        const progressSafe = JSON.stringify(state.solved) === JSON.stringify(before.solved)
          && JSON.stringify(state.keys) === JSON.stringify(before.keys) && score(state) === before.score;
        $('hint').click(); const hiddenAfterToggle = $('hint-text').hidden;
        $('hint').click(); const visibleAfterToggle = !$('hint-text').hidden;
        answer(question, String(question.answer));
        const solutionAfterCorrect = $('feedback').querySelectorAll('li').length === question.explanation.length
          && question.explanation.every(step => $('feedback').textContent.includes(step))
          && $('hint-text').hidden && $('check').disabled && score(state) === before.score + 10;
        const attempts = state.attempts[question.id], recordedScore = score(state);
        const saved = localStorage.getItem('feedback-test-progress');
        showQuestion(options); $('question-form').requestSubmit();
        const reviewSafe = $('feedback').querySelectorAll('li').length === question.explanation.length
          && state.attempts[question.id] === attempts && score(state) === recordedScore
          && localStorage.getItem('feedback-test-progress') === saved;
        results.push({ bank: randomized ? 'randomized' : 'original', id: question.id,
          clueOnly: Boolean(clueOnly), progressSafe, hiddenAfterToggle, visibleAfterToggle, solutionAfterCorrect, reviewSafe });
      }
    }
    $('modal').close();
    return results;
  });
  expect(results).toHaveLength(24);
  for (const result of results) {
    expect(result, `${result.bank}/${result.id}`).toMatchObject({ clueOnly: true, progressSafe: true,
      hiddenAfterToggle: true, visibleAfterToggle: true, solutionAfterCorrect: true, reviewSafe: true });
  }
});
