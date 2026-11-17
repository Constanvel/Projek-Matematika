import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, checkAnswer } from '../js/data/questions.js';
import { freshState, validateState } from '../js/state.js';
import { getMachineFlow } from '../js/data/machines.js';

const api = await import('../js/data/question-runs.js').catch(() => ({}));
const generate = seed => {
  assert.equal(typeof api.generateRunQuestions, 'function');
  return api.generateRunQuestions(seed);
};
const affine = (text, name) => {
  const match = text.match(new RegExp(`${name}\\(x\\) = (\\d*)x ([+−]) (\\d+)`));
  assert.ok(match, text);
  const a = Number(match[1] || 1), b = Number(match[3]) * (match[2] === '−' ? -1 : 1);
  return { a, b, value: x => a * x + b, inverse: y => (y - b) / a };
};
const chosen = question => question.type === 'number' ? question.answer
  : question.options.find(option => option.id === question.answer).label;

test('question runs repeat exactly for a saved seed and vary across new runs', () => {
  assert.deepEqual(generate(12345), generate(12345));
  assert.notDeepEqual(generate(12345).map(q => q.prompt), generate(98765).map(q => q.prompt));
  const state = { ...freshState(), questionSeed: 12345, questionSetVersion: 1 };
  assert.deepEqual(validateState(state), state);
  assert.deepEqual(api.questionsForState(validateState(JSON.parse(JSON.stringify(state)))), generate(12345));
  assert.deepEqual(api.questionsForState(freshState()), questions);
  assert.notEqual(api.newQuestionSeed(12345), 12345);
  for (const patch of [{ questionSeed: 0 }, { questionSeed: -1 }, { questionSeed: 2 ** 32 },
    { questionSeed: '12345' }, { questionSeed: 1.5 }, { questionSetVersion: 2 }]) {
    assert.equal(validateState({ ...state, ...patch }), null);
  }
  assert.equal(validateState({ ...freshState(), questionSetVersion: 1 }), null);
});

test('generated numeric exercises and encryption round trips agree with independent arithmetic', () => {
  for (let seed = 1; seed <= 128; seed++) {
    const bank = generate(seed);
    assert.equal(bank.length, 12);
    assert.deepEqual(bank.map(q => q.id), Array.from({ length: 12 }, (_, i) => `q${i + 1}`));
    for (const question of bank) {
      const q = question, id = Number(q.id.slice(1));
      assert.equal(q.levelId, Math.floor((id - 1) / 3));
      assert.ok(q.explanation.length > 0);
      if (q.options) {
        assert.equal(q.options.length, 4);
        assert.equal(new Set(q.options.map(option => option.label)).size, 4);
        assert.equal(q.options.filter(option => checkAnswer(q, option.id)).length, 1);
      }
      let expected;
      if (id === 1) {
        const f = affine(q.functions, 'f'); const n = Number(q.prompt.match(/f\((-?\d+)\)\?/)[1]);
        expected = f.value(n);
      } else if (id === 2) {
        const [, b, a] = q.functions.match(/g\(x\) = (\d+) − (\d+)x/);
        const n = Number(q.prompt.match(/g\((-?\d+)\)\?/)[1]); expected = Number(b) - Number(a) * n;
      } else if ([4, 5].includes(id)) {
        const f = affine(q.functions, 'f'), g = affine(q.functions, 'g');
        const n = Number(q.prompt.match(/[fg]\([fg]\((-?\d+)\)\)/)[1]);
        expected = id === 4 ? f.value(g.value(n)) : g.value(f.value(n));
        const path = getMachineFlow(q.id, true, q.machine).paths[0];
        assert.equal(path.output, expected);
        assert.equal(path.steps[0].output, id === 4 ? g.value(n) : f.value(n));
      } else if (id === 6) {
        const f = affine(q.functions, 'f'); const n = Number(q.prompt.match(/f\(g\((\d+)\)\) −/)[1]);
        expected = f.value(n ** 2) - f.value(n) ** 2;
      }
      if (expected !== undefined) {
        assert.ok(Number.isInteger(expected)); assert.equal(Number(chosen(q)), expected, `${seed}/${q.id}`);
      }
    }
  }
});

test('stage 3 questions are identical for every seed', () => {
  for (let seed = 1; seed <= 64; seed++) assert.deepEqual(generate(seed).slice(6), questions.slice(6));
});

test('relation choices have exactly one valid answer after shuffling', () => {
  for (let seed = 1; seed <= 64; seed++) {
    const relation = generate(seed)[2];
    const domain = relation.functions.match(/A = \{([^}]+)\}/)[1].split(',').map(Number);
    const valid = relation.options.filter(option => {
      const pairs = [...option.label.matchAll(/\((\d+), (\d+)\)/g)].map(m => [Number(m[1]), Number(m[2])]);
      return domain.every(x => pairs.filter(pair => pair[0] === x).length === 1);
    });
    assert.deepEqual(valid.map(option => option.id), [relation.answer]);
  }
});
