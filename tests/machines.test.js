import test from 'node:test';
import assert from 'node:assert/strict';
import { machineDefinitions, getMachineFlow } from '../js/data/machines.js';
import { questions } from '../js/data/questions.js';

const order = path => path.steps.map(step => step.name);

test('authored cave paths preserve inner-first ordering', () => {
  assert.deepEqual(order(getMachineFlow('q4').paths[0]), ['g', 'f']);
  assert.deepEqual(order(getMachineFlow('q5').paths[0]), ['f', 'g']);
  const comparison = getMachineFlow('q6');
  assert.equal(comparison.paths.length, 2);
  assert.deepEqual(comparison.paths.map(order), [['g', 'f'], ['f', 'g']]);
  assert.deepEqual(comparison.paths.map(path => path.label), ['f ∘ g', 'g ∘ f']);
});

test('cave intermediate values agree with independent arithmetic', () => {
  const cases = [
    { id: 'q4', input: 4, functions: { g: x => x - 1, f: x => 2 * x + 3 } },
    { id: 'q5', input: -1, functions: { f: x => x + 2, g: x => 3 * x } },
    { id: 'q6', input: 2, functions: { f: x => 2 * x + 1, g: x => x ** 2 } },
  ];
  for (const { id, input, functions } of cases) {
    for (const path of getMachineFlow(id, true).paths) {
      assert.equal(path.input, input, id);
      let value = input;
      for (const step of path.steps) {
        assert.equal(step.input, value, `${id}: ${step.name} input`);
        value = functions[step.name](value);
        assert.equal(step.output, value, `${id}: ${step.name} output`);
      }
      assert.equal(path.output, value, id);
    }
  }
  assert.deepEqual(getMachineFlow('q4', true).paths[0].steps.map(step => step.output), [3, 9]);
  assert.deepEqual(getMachineFlow('q5', true).paths[0].steps.map(step => step.output), [1, 3]);
  const flow = getMachineFlow('q6', true);
  assert.deepEqual(flow.paths.map(path => path.output), [9, 25]);
  assert.equal(machineDefinitions.q6.difference, 9 - 25);
  assert.equal(flow.summary, '9 − 25 = -16');
  assert.equal(questions.find(question => question.id === 'q6').answer, 9 - 25);
});

test('unsolved presentation is symbolic and solved/review presentation reveals every step', () => {
  for (const question of questions) {
    const hidden = getMachineFlow(question.id);
    for (const path of hidden.paths) {
      assert.equal(path.input, null);
      assert.equal(path.output, null);
      assert.deepEqual(path.tokens, ['INPUT', ...order(path), 'OUTPUT']);
      for (const step of path.steps) {
        assert.equal(step.input, null);
        assert.equal(step.output, null);
      }
    }
  }
  assert.deepEqual(getMachineFlow('q4', true).paths[0].tokens,
    ['INPUT 4', 'g(4) = 3', 'f(3) = 9', 'OUTPUT 9']);
  assert.deepEqual(getMachineFlow('q5', true).paths[0].tokens,
    ['INPUT -1', 'f(-1) = 1', 'g(1) = 3', 'OUTPUT 3']);
  assert.deepEqual(getMachineFlow('q6', true).paths.map(path => path.tokens), [
    ['INPUT 2', 'g(2) = 4', 'f(4) = 9', 'OUTPUT 9'],
    ['INPUT 2', 'f(2) = 5', 'g(5) = 25', 'OUTPUT 25'],
  ]);
  assert.doesNotMatch(getMachineFlow('q6').summary, /9|25|16/);
});

test('all question paths are explicit and mixed/relational questions stay generic', () => {
  assert.deepEqual(Object.keys(machineDefinitions), questions.map(question => question.id));
  assert.equal(getMachineFlow('q3').kind, 'relation');
  assert.deepEqual(getMachineFlow('q3').labels, ['SETIAP INPUT', 'TEPAT SATU OUTPUT']);
  for (const id of ['q10', 'q11', 'q12']) {
    for (const solved of [false, true]) {
      const flow = getMachineFlow(id, solved);
      assert.equal(flow.kind, 'mixed');
      assert.deepEqual(flow.paths, []);
      assert.deepEqual(flow.labels, ['PECAHKAN BERTAHAP', 'PERIKSA SETIAP HASIL']);
    }
  }
  assert.deepEqual(order(getMachineFlow('q1').paths[0]), ['f']);
  assert.deepEqual(order(getMachineFlow('q2').paths[0]), ['g']);
  assert.equal(getMachineFlow('q1', true).paths[0].output, 2 * 4 + 3);
  assert.equal(getMachineFlow('q2', true).paths[0].output, 5 - 3 * -2);
  assert.deepEqual(order(getMachineFlow('q7').paths[0]), ['g', 'f']);
  assert.equal(getMachineFlow('q7', true).paths[0].output, 2 * 3 ** 2 + 1);
  assert.deepEqual(order(getMachineFlow('q8').paths[0]), ['f', 'g']);
  assert.deepEqual(order(getMachineFlow('q9').paths[0]), ['g', 'f']);
  assert.equal(getMachineFlow('q8', true).paths[0].output, '3x + 6');
  assert.equal(getMachineFlow('q9', true).paths[0].output, '4x² + 4x − 2');
});

test('presentation calls are pure and unknown questions use a neutral fallback', () => {
  const original = JSON.stringify(machineDefinitions);
  const flow = getMachineFlow('q4', true);
  flow.paths[0].steps[0].output = 100;
  flow.paths[0].tokens.push('changed');
  getMachineFlow('q3').labels.push('changed');
  assert.equal(JSON.stringify(machineDefinitions), original);
  assert.equal(getMachineFlow('q4', true).paths[0].steps[0].output, 3);
  assert.deepEqual(getMachineFlow('unknown'), {
    kind: 'generic', paths: [], labels: ['INPUT', 'FUNGSI', 'OUTPUT'], summary: '',
  });
});
