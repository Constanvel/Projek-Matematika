import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RUN_KEY, LEADERBOARD_KEY, createRun, takeFall, sanitizeName,
  loadRun, saveRun, resetRun, getLeaderboard, recordVictory,
} from '../js/game/run-records.js';

function memoryStorage(initial = []) {
  const data = new Map(initial);
  return {
    data,
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
}

const victory = (name, score = 120, falls = 0, elapsed = 10) => ({ name, score, falls, elapsed });

test('runs start independently with three health points and no elapsed time', () => {
  assert.deepEqual(createRun(), { health: 3, maxHealth: 3, falls: 0, elapsed: 0, completed: false, recorded: false });
  const first = createRun();
  first.elapsed = 4;
  assert.equal(createRun().elapsed, 0);
});

test('third fall leaves zero health and does not count further falls until retry', () => {
  const run = createRun();
  run.elapsed = 42.5;
  assert.deepEqual(takeFall(run), { depleted: false });
  assert.equal(run.health, 2);
  assert.deepEqual(takeFall(run), { depleted: false });
  assert.equal(run.health, 1);
  assert.deepEqual(takeFall(run), { depleted: true });
  assert.deepEqual(run, { health: 0, maxHealth: 3, falls: 3, elapsed: 42.5, completed: false, recorded: false });
  assert.deepEqual(takeFall(run), { depleted: true });
  assert.equal(run.falls, 3);
  assert.equal(run.health, 0);
});

test('zero health survives save and reload without changing learning or leaderboard', () => {
  const storage = memoryStorage([['gundul-warrior-v1', '{"learning":true}'], [LEADERBOARD_KEY, '[]']]);
  const run = { ...createRun(), health: 0, falls: 3, elapsed: 42.5 };
  assert.equal(saveRun(storage, run), true);
  assert.deepEqual(loadRun(storage), run);
  assert.equal(storage.getItem('gundul-warrior-v1'), '{"learning":true}');
  assert.equal(storage.getItem(LEADERBOARD_KEY), '[]');
});

test('retry restores health while keeping falls and elapsed history', async () => {
  const { retryRun } = await import('../js/game/run-records.js');
  const run = { ...createRun(), health: 0, falls: 3, elapsed: 42.5 };
  retryRun(run);
  assert.deepEqual(run, { health: 3, maxHealth: 3, falls: 3, elapsed: 42.5, completed: false, recorded: false });
  assert.deepEqual(takeFall(run), { depleted: false });
  assert.equal(run.health, 2);
  assert.equal(run.falls, 4);
});

test('run persistence uses its own namespace and preserves learning and leaderboard', () => {
  const storage = memoryStorage([
    ['gundul-warrior-v1', '{"learning":true}'],
    ['function-adventure-v1', '{"legacy":true}'],
  ]);
  assert.equal(RUN_KEY, 'gundul-warrior-run-v1');
  assert.equal(LEADERBOARD_KEY, 'gundul-warrior-leaderboard-v1');
  assert.deepEqual(loadRun(storage), createRun());
  const run = { health: 2, maxHealth: 3, falls: 4, elapsed: 99.75, completed: true, recorded: true };
  assert.equal(saveRun(storage, run), true);
  assert.deepEqual(loadRun(storage), run);
  recordVictory(storage, victory('First'));
  const leaderboard = storage.getItem(LEADERBOARD_KEY);
  assert.deepEqual(resetRun(storage), createRun());
  assert.deepEqual(loadRun(storage), createRun());
  assert.equal(storage.getItem(LEADERBOARD_KEY), leaderboard);
  assert.equal(storage.getItem('gundul-warrior-v1'), '{"learning":true}');
  assert.equal(storage.getItem('function-adventure-v1'), '{"legacy":true}');
});

test('invalid persisted runs fall back or clamp without trusting extra fields', () => {
  const storage = memoryStorage();
  for (const raw of ['{', 'null', '[]', '"run"']) {
    storage.data.set(RUN_KEY, raw);
    assert.deepEqual(loadRun(storage), createRun());
  }
  storage.data.set(RUN_KEY, JSON.stringify({ health: 80, maxHealth: 100, falls: -9, elapsed: '100', extra: true }));
  assert.deepEqual(loadRun(storage), createRun());
  storage.data.set(RUN_KEY, JSON.stringify({ health: -5, falls: 2.9, elapsed: 3.25 }));
  assert.deepEqual(loadRun(storage), { health: 1, maxHealth: 3, falls: 2, elapsed: 3.25, completed: false, recorded: false });
  assert.equal(saveRun(storage, { health: NaN, falls: Infinity, elapsed: -4 }), true);
  assert.deepEqual(loadRun(storage), createRun());
});

test('completion and recording flags preserve booleans and reject truthy malformed values', () => {
  const storage = memoryStorage();
  const completed = { ...createRun(), completed: true };
  assert.equal(saveRun(storage, completed), true);
  assert.deepEqual(loadRun(storage), completed);
  completed.recorded = true;
  saveRun(storage, completed);
  assert.deepEqual(loadRun(storage), completed);
  saveRun(storage, { ...completed, completed: 'true', recorded: 1 });
  assert.deepEqual(loadRun(storage), createRun());
  storage.data.set(RUN_KEY, JSON.stringify({ health: 3, falls: 0, elapsed: 0 }));
  assert.deepEqual(loadRun(storage), createRun());
  const run = { ...completed };
  takeFall(run);
  assert.equal(run.completed, true);
  assert.equal(run.recorded, true);
  assert.deepEqual(resetRun(storage), createRun());
});

test('names are plain bounded Unicode text with a safe default', () => {
  assert.equal(sanitizeName(undefined), 'Petualang');
  assert.equal(sanitizeName({ toString() { throw new Error('not text'); } }), 'Petualang');
  assert.equal(sanitizeName('  '), 'Petualang');
  assert.equal(sanitizeName('  Ada   Lovelace  '), 'Ada Lovelace');
  assert.equal(sanitizeName('<b>Ada</b>\u0000\u202e'), 'bAda/b');
  assert.equal(sanitizeName('a'.repeat(30)), 'a'.repeat(20));
  assert.equal(sanitizeName('😀'.repeat(30)), '😀'.repeat(20));
});

test('leaderboard ranks score descending, falls ascending, then elapsed ascending', () => {
  const storage = memoryStorage();
  recordVictory(storage, victory('Lower score', 100, 0, 1));
  recordVictory(storage, victory('More falls', 120, 3, 1));
  recordVictory(storage, victory('Slower', 120, 1, 30));
  const result = recordVictory(storage, victory('Winner', 120, 1, 20));
  assert.deepEqual(result.map(entry => entry.name), ['Winner', 'Slower', 'More falls', 'Lower score']);
  assert.deepEqual(getLeaderboard(storage), result);
});

test('leaderboard keeps only ten and preserves insertion order for exact ties and duplicates', () => {
  const storage = memoryStorage();
  for (let index = 0; index < 12; index += 1) recordVictory(storage, victory(`Run ${index}`));
  assert.deepEqual(getLeaderboard(storage).map(entry => entry.name),
    Array.from({ length: 10 }, (_, index) => `Run ${index}`));
  const duplicates = memoryStorage();
  recordVictory(duplicates, victory('Same'));
  recordVictory(duplicates, victory('Same'));
  assert.equal(getLeaderboard(duplicates).length, 2);
});

test('malformed leaderboard storage and invalid records are ignored', () => {
  const storage = memoryStorage();
  for (const raw of ['{', 'null', '{}', '"entries"']) {
    storage.data.set(LEADERBOARD_KEY, raw);
    assert.deepEqual(getLeaderboard(storage), []);
  }
  storage.data.set(LEADERBOARD_KEY, JSON.stringify([
    victory('Good'), null, [], {}, victory('Negative', -1), victory('Fractional', 1.5),
    victory('Bad falls', 120, '1'), victory('Bad elapsed', 120, 1, -1),
    { ...victory('Bad name'), name: {} },
  ]));
  assert.deepEqual(getLeaderboard(storage), [victory('Good')]);
});

test('recording sanitizes values, strips extra fields, and does not mutate the submitted victory', () => {
  const storage = memoryStorage();
  const input = { name: '   Player   ', score: 120.9, falls: -4, elapsed: 15.25, injected: true };
  assert.deepEqual(recordVictory(storage, input), [victory('Player', 120, 0, 15.25)]);
  assert.equal(input.name, '   Player   ');
  assert.equal(input.score, 120.9);
  assert.deepEqual(recordVictory(memoryStorage(), null), [victory('Petualang', 0, 0, 0)]);
  assert.deepEqual(recordVictory(memoryStorage(), { score: Infinity, falls: NaN, elapsed: -5 }),
    [victory('Petualang', 0, 0, 0)]);
});

test('local scores stay within the mathematics maximum', () => {
  const storage = memoryStorage();
  assert.equal(recordVictory(storage, victory('Overflow', 999))[0].score, 120);
  storage.setItem(LEADERBOARD_KEY, JSON.stringify([victory('Invalid', 121)]));
  assert.deepEqual(getLeaderboard(storage), []);
});

test('unavailable or throwing storage never interrupts a run or victory', () => {
  const denied = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('quota'); },
  };
  const throwingProperties = Object.defineProperties({}, {
    getItem: { get() { throw new Error('denied'); } },
    setItem: { get() { throw new Error('denied'); } },
  });
  for (const storage of [undefined, null, {}, denied, throwingProperties]) {
    assert.deepEqual(loadRun(storage), createRun());
    assert.equal(saveRun(storage, createRun()), false);
    assert.deepEqual(resetRun(storage), createRun());
    assert.deepEqual(getLeaderboard(storage), []);
    assert.deepEqual(recordVictory(storage, victory('Player')), [victory('Player')]);
  }
});
