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
      } else if (id === 7) {
        const f = affine(q.functions, 'f'), g = affine(q.functions, 'g');
        const [, op, raw] = q.prompt.match(/\(f ([+−×÷]) g\)\((\d+)\)/); const n = Number(raw);
        expected = op === '+' ? f.value(n) + g.value(n) : op === '−' ? f.value(n) - g.value(n)
          : op === '×' ? f.value(n) * g.value(n) : f.value(n) / g.value(n);
      } else if (id === 10) {
        const f = affine(q.functions, 'f'), g = affine(q.functions, 'g');
        expected = f.value(g.value(Number(q.prompt.match(/p = (\d+)/)[1])));
      } else if (id === 11) {
        const e = affine(q.functions, 'E'); const cipher = Number(q.prompt.match(/c = (\d+)/)[1]);
        expected = e.inverse(cipher); assert.equal(e.value(expected), cipher);
      } else if (id === 12) {
        const f = affine(q.functions, 'f'), g = affine(q.functions, 'g');
        const cipher = Number(q.prompt.match(/c = (\d+)/)[1]); expected = g.inverse(f.inverse(cipher));
        assert.equal(f.value(g.value(expected)), cipher);
        const flow = getMachineFlow(q.id, true, q.machine).paths[0];
        assert.equal(flow.input, cipher); assert.equal(flow.steps[0].output, f.inverse(cipher));
        assert.equal(flow.output, expected);
      }
      if (expected !== undefined) {
        assert.ok(Number.isInteger(expected)); assert.equal(Number(chosen(q)), expected, `${seed}/${q.id}`);
      }
    }
  }
});

test('relation and inverse choices have exactly one mathematically valid answer after shuffling', () => {
  const positions = new Set();
  for (let seed = 1; seed <= 64; seed++) {
    const bank = generate(seed), relation = bank[2], inverse = bank[7], composition = bank[8];
    positions.add(inverse.answer);
    const domain = relation.functions.match(/A = \{([^}]+)\}/)[1].split(',').map(Number);
    const validRelations = relation.options.filter(option => {
      const pairs = [...option.label.matchAll(/\((\d+), (\d+)\)/g)].map(match => [Number(match[1]), Number(match[2])]);
      return domain.every(x => pairs.filter(pair => pair[0] === x).length === 1);
    });
    assert.deepEqual(validRelations.map(option => option.id), [relation.answer]);
    const f = affine(inverse.functions, 'f');
    const validInverses = inverse.options.filter(option => {
      const label = option.label, match = label.match(/^\(x ([−+]) (\d+)\) \/ (\d+)$/);
      if (!match) return false;
      return [-7, 0, 13].every(y => Math.abs(f.value((y + Number(match[2]) * (match[1] === '−' ? -1 : 1)) / Number(match[3])) - y) < 1e-9);
    });
    assert.deepEqual(validInverses.map(option => option.id), [inverse.answer]);
    const outer = affine(composition.functions, 'f'), inner = affine(composition.functions, 'g');
    const formulas = {
      'g⁻¹(f⁻¹(x))': x => inner.inverse(outer.inverse(x)),
      'f⁻¹(g⁻¹(x))': x => outer.inverse(inner.inverse(x)),
      'f(g(x))': x => outer.value(inner.value(x)),
      'g(f(x))': x => inner.value(outer.value(x)),
    };
    const validOrders = composition.options.filter(option => [-7, 0, 13].every(y =>
      Math.abs(outer.value(inner.value(formulas[option.label](y))) - y) < 1e-9));
    assert.deepEqual(validOrders.map(option => option.id), [composition.answer]);
  }
  assert.equal(positions.size, 4);
});
