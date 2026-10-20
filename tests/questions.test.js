import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, checkAnswer } from '../js/data/questions.js';

const byId = (id) => questions.find((question) => question.id === id);

test('question bank has twelve ordered questions across four levels', () => {
  assert.equal(questions.length, 12);
  assert.equal(new Set(questions.map(({ id }) => id)).size, 12);
  questions.forEach((question, index) => {
    assert.equal(question.id, `q${index + 1}`);
    assert.equal(question.levelId, Math.floor(index / 3));
    for (const field of ['title', 'prompt', 'functions', 'hint']) {
      assert.equal(typeof question[field], 'string');
      assert.ok(question[field].trim().length > 0);
    }
    assert.ok(Array.isArray(question.explanation));
    assert.ok(question.explanation.length > 0);
    for (const step of question.explanation) {
      assert.equal(typeof step, 'string');
      assert.ok(step.trim().length > 0);
    }
    assert.ok(['number', 'multiple-choice'].includes(question.type));
    if (question.type === 'number') {
      assert.ok(Number.isInteger(question.answer));
    } else {
      assert.equal(typeof question.answer, 'string');
      assert.ok(Array.isArray(question.options));
      assert.ok(question.options.length >= 2);
      const ids = question.options.map(({ id, label }) => {
        assert.equal(typeof id, 'string');
        assert.ok(id.trim().length > 0);
        assert.equal(typeof label, 'string');
        assert.ok(label.trim().length > 0);
        return id;
      });
      assert.equal(new Set(ids).size, ids.length);
      assert.ok(ids.includes(question.answer));
    }
  });
});

test('numeric answers agree with independent mathematical calculations', () => {
  const expected = {
    q1: 2 * 4 + 3,
    q2: 5 - 3 * -2,
    q4: 2 * (4 - 1) + 3,
    q5: 3 * (-1 + 2),
    q6: (2 * (2 ** 2) + 1) - (2 * 2 + 1) ** 2,
    q7: 2 * (3 ** 2) + 1,
    q11: (2 * -1 - 3) ** 2 + 1 - (2 * 2 - 3),
    q12: ((6 * 2 + 7) + 1) / 2,
  };
  for (const [id, answer] of Object.entries(expected)) {
    assert.equal(byId(id).answer, answer, id);
    assert.equal(checkAnswer(byId(id), String(answer)), true, id);
    assert.equal(checkAnswer(byId(id), answer + 1), false, id);
  }
});

test('q3 selects the relation assigning exactly one image to every domain member', () => {
  const relations = {
    a: [[1, 2], [1, 4], [2, 6], [3, 2]],
    b: [[1, 2], [2, 4], [3, 6]],
    c: [[1, 2], [2, 4]],
    d: [[1, 2], [2, 4], [3, 2], [3, 6]],
  };
  const valid = Object.keys(relations).filter((id) =>
    [1, 2, 3].every((x) => relations[id].filter(([input]) => input === x).length === 1)
    && relations[id].every(([, output]) => [2, 4, 6].includes(output)),
  );
  assert.deepEqual(valid, [byId('q3').answer]);
});

test('composition choices match independent algebraic calculations', () => {
  const cases = [
    {
      id: 'q8',
      compose: (x) => 3 * (x + 2),
      choices: {
        a: (x) => 3 * x + 2,
        b: (x) => x + 6,
        c: (x) => 3 * x ** 2 + 6 * x,
        d: (x) => 3 * x + 6,
      },
      label: '3x + 6',
    },
    {
      id: 'q9',
      compose: (x) => (2 * x + 1) ** 2 - 3,
      choices: {
        a: (x) => 2 * x ** 2 - 5,
        b: (x) => 4 * x ** 2 + 4 * x - 2,
        c: (x) => 4 * x ** 2 - 2,
        d: (x) => 4 * x ** 2 + 4 * x + 1,
      },
      label: '4x² + 4x − 2',
    },
  ];
  for (const { id, compose, choices, label } of cases) {
    const valid = Object.keys(choices).filter((choice) =>
      [-5, -1, 0, 2, 10].every((x) => choices[choice](x) === compose(x)),
    );
    assert.deepEqual(valid, [byId(id).answer], id);
    assert.equal(byId(id).options.find((option) => option.id === valid[0]).label, label);
  }
});

test('numeric compositions preserve order and mixed final uses both evaluations', () => {
  const f = (x) => 2 * x + 1;
  const g = (x) => x ** 2;
  assert.notEqual(f(g(2)), g(f(2)));
  assert.equal(byId('q6').answer, f(g(2)) - g(f(2)));

  const finalF = (x) => 3 * x - 2;
  const finalG = (x) => x + 4;
  const expected = finalF(2) + finalG(finalF(1));
  const valid = byId('q10').options.filter(({ label }) => Number(label) === expected);
  assert.deepEqual(valid.map(({ id }) => id), [byId('q10').answer]);
});

test('revised questions stay within function evaluation and composition', () => {
  for (const id of ['q4', 'q5', 'q6', 'q9', 'q10', 'q11']) {
    const question = byId(id);
    const text = [question.title, question.prompt, question.functions, question.hint,
      ...question.explanation, ...(question.options ?? []).map(({ label }) => label)].join(' ');
    assert.doesNotMatch(text, /domain|kodomain|range|invers|⁻¹/i, id);
  }
  for (const id of ['q4', 'q5', 'q6']) assert.equal(byId(id).type, 'number');
  assert.equal(byId('q9').type, 'multiple-choice');
});

test('all authored answers are accepted and alternate choices are incorrect', () => {
  for (const question of questions) {
    assert.equal(checkAnswer(question, question.answer), true, question.id);
    if (question.type === 'multiple-choice') {
      assert.equal(checkAnswer(question, ` ${question.answer} `), true);
      for (const option of question.options) {
        assert.equal(checkAnswer(question, option.id), option.id === question.answer);
      }
      assert.equal(checkAnswer(question, 'unknown-option'), null);
    }
  }
});

test('empty, unsupported, and nonfinite inputs are invalid', () => {
  const invalid = ['', ' ', '\t\n', null, undefined, true, false, [], [11], {}, NaN, Infinity, -Infinity];
  for (const question of questions) {
    for (const raw of invalid) {
      assert.equal(checkAnswer(question, raw), null, `${question.id}: ${String(raw)}`);
    }
  }
});

test('numeric validation converts the entire input without evaluating expressions', () => {
  const question = byId('q1');
  for (const raw of ['11abc', '11 px', '11,0', '1 1', '2 * 4 + 3', '11; throw new Error()', 'NaN', 'Infinity', '-Infinity', '1e309', '--11']) {
    assert.equal(checkAnswer(question, raw), null, raw);
  }
  for (const raw of [11, '11', ' 11 ', '+11', '11.0', '1.1e1']) {
    assert.equal(checkAnswer(question, raw), true, String(raw));
  }
  assert.equal(checkAnswer(question, '0'), false);
  assert.equal(checkAnswer(question, 0), false);
  assert.equal(checkAnswer(question, '11.5'), false);
});
