import { test, expect } from '@playwright/test';
import { freshState, completeQuestion, advanceLevel, score } from '../../js/state.js';
import { levels } from '../../js/data/levels.js';
import { createRun, RUN_KEY, LEADERBOARD_KEY } from '../../js/game/run-records.js';

const STATE_KEY = 'gundul-warrior-v1';

async function seedOnce(page, state, run, entries = []) {
  await page.addInitScript(({ state, run, entries, stateKey, runKey, boardKey }) => {
    // Reloads must read the real saved result, never overwrite it with this fixture.
    if (sessionStorage.getItem('run-records-fixture-installed')) return;
    localStorage.setItem(stateKey, JSON.stringify(state));
    localStorage.setItem(runKey, JSON.stringify(run));
    localStorage.setItem(boardKey, JSON.stringify(entries));
    sessionStorage.setItem('run-records-fixture-installed', 'true');
  }, { state, run, entries, stateKey: STATE_KEY, runKey: RUN_KEY, boardKey: LEADERBOARD_KEY });
}

async function continueGame(page) {
  await page.locator('#continue').click();
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#board')).toBeFocused();
}

async function readStored(page, key) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
}

async function walkIntoFall(page, falls) {
  await page.keyboard.down('KeyD');
  try {
    // Observe real falling physics before the persisted respawn, not a synthetic event.
    await page.waitForFunction(() => Number(document.getElementById('board').dataset.playerY) > 500, undefined, { timeout: 8000 });
    await expect.poll(async () => (await readStored(page, RUN_KEY)).falls, { timeout: 8000 }).toBe(falls);
  } finally {
    await page.keyboard.up('KeyD');
  }
  await expect(page.locator('#board')).toHaveAttribute('data-player-y', '380');
}

test('three live falls restore health without losing progress; reload and pause preserve run data', async ({ page }) => {
  test.setTimeout(45000);
  const route = levels[0].parkour[0];
  const state = freshState();
  state.attempts.q1 = 1;
  completeQuestion(state, 'q1');
  state.checkpoint = route.checkpointId;
  state.collected.push(levels[0].collectibles[0].id);
  await seedOnce(page, state, createRun());
  await page.goto('/');
  await continueGame(page);
  await expect(page.locator('#board')).toHaveAttribute('data-player-x', String(route.start));
  await expect(page.locator('#health')).toHaveText('3/3');
  await expect(page.locator('#health-status [data-icon="heart-full"]')).toHaveCount(3);

  for (let falls = 1; falls <= 3; falls++) {
    await walkIntoFall(page, falls);
    await expect(page.locator('#health')).toHaveText(falls === 3 ? '3/3' : `${3 - falls}/3`);
    await expect(page.locator('#health-status [data-icon="heart-full"]')).toHaveCount(falls === 3 ? 3 : 3 - falls);
    await expect(page.locator('#health-status [data-icon="heart-empty"]')).toHaveCount(falls === 3 ? 0 : falls);
    const saved = await readStored(page, STATE_KEY);
    expect(saved.solved).toEqual(state.solved);
    expect(saved.attempts).toEqual(state.attempts);
    expect(saved.keys).toEqual(state.keys);
    expect(saved.collected).toEqual(expect.arrayContaining(state.collected));
    expect(saved.checkpoint).toBe(route.checkpointId);
    await expect(page.locator('#score')).toHaveText(String(score(state)));
    expect(Number(await page.locator('#board').getAttribute('data-player-x'))).toBeLessThan(route.gap.start);

    if (falls === 2) {
      await expect(page.locator('#health-status')).toHaveAttribute('data-low', 'true');
      await page.screenshot({ path: 'test-results/run-health-low.png', fullPage: true });
      await page.reload();
      await continueGame(page);
      await expect(page.locator('#health')).toHaveText('1/3');
      await expect(page.locator('#health-status [data-icon="heart-full"]')).toHaveCount(1);
      await expect(page.locator('#health-status [data-icon="heart-empty"]')).toHaveCount(2);
      expect((await readStored(page, RUN_KEY)).falls).toBe(2);
      await expect(page.locator('#board')).toHaveAttribute('data-player-x', String(route.start));
    }
  }
  await expect(page.locator('#health-status')).toHaveAttribute('data-low', 'false');
  await expect(page.locator('#interaction')).toContainText('progres belajar tetap aman');
  expect(await readStored(page, RUN_KEY)).toMatchObject({ health: 3, falls: 3, completed: false, recorded: false });

  await page.locator('#pause').click();
  await expect(page.locator('#modal')).toBeVisible();
  await expect(page.locator('#board')).toHaveAttribute('data-paused', 'true');
  const pausedRun = await readStored(page, RUN_KEY);
  expect(pausedRun.elapsed).toBeGreaterThan(0);
  await page.waitForTimeout(1100);
  // Force another persistence pass so unchanged storage cannot hide a running clock.
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  expect((await readStored(page, RUN_KEY)).elapsed).toBe(pausedRun.elapsed);
  await page.reload();
  await continueGame(page);
  await expect(page.locator('#health')).toHaveText('3/3');
  expect((await readStored(page, RUN_KEY)).falls).toBe(3);
});

test('home leaderboard explains an empty local board', async ({ page }) => {
  await page.goto('/');
  await page.locator('#leaderboard').click();
  await expect(page.locator('#modal')).toBeVisible();
  await expect(page.locator('#dialog-title')).toHaveText('Leaderboard lokal');
  await expect(page.locator('#dialog-content')).toContainText('Belum ada hasil.');
  await expect(page.locator('#dialog-content')).toContainText('Tidak tersinkron lintas perangkat.');
  await expect(page.locator('.leaderboard-table')).toHaveCount(0);
  await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  await expect(page.locator('#modal')).toBeHidden();
});

test('victory records safe names in rank order once and a new game preserves the leaderboard', async ({ page }) => {
  const state = freshState();
  for (const level of levels) {
    for (const id of level.questionIds) {
      state.attempts[id] = 1;
      completeQuestion(state, id);
    }
    advanceLevel(state);
  }
  expect(state.won).toBe(true);
  const entries = [
    { name: 'Lower score', score: 110, falls: 0, elapsed: 1 },
    { name: 'Slower', score: 120, falls: 4, elapsed: 140 },
    { name: 'Fewer falls', score: 120, falls: 3, elapsed: 300 },
    { name: 'Faster', score: 120, falls: 4, elapsed: 100 },
  ];
  await seedOnce(page, state, { ...createRun(), elapsed: 125, falls: 4, completed: true, recorded: false }, entries);
  await page.goto('/');
  await page.locator('#continue').click();
  await expect(page.locator('#victory')).toBeVisible();
  await expect(page.locator('#final-stats')).toContainText('2:05');
  await page.locator('#player-name').fill('<img src=x>');
  // A failed write must leave the action available and report failure, not success.
  await page.evaluate(() => {
    window.originalRecordSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'gundul-warrior-leaderboard-v1') throw new Error('Storage denied');
      return window.originalRecordSetItem.call(this, key, value);
    };
  });
  await page.locator('#record-result').click();
  await expect(page.locator('#record-status')).toContainText('Hasil belum tersimpan');
  await expect(page.locator('#record-result')).toBeEnabled();
  await page.evaluate(() => { Storage.prototype.setItem = window.originalRecordSetItem; delete window.originalRecordSetItem; });
  await page.locator('#record-result').click();
  await expect(page.locator('#record-status')).toHaveText('Hasil tersimpan di leaderboard lokal.');
  await expect(page.locator('#record-result')).toBeDisabled();
  await expect(page.locator('#player-name')).toBeDisabled();
  expect(await readStored(page, RUN_KEY)).toMatchObject({ completed: true, recorded: true, falls: 4, elapsed: 125 });
  const savedBoard = await readStored(page, LEADERBOARD_KEY);
  expect(savedBoard.map(entry => entry.name)).toEqual(['Fewer falls', 'Faster', 'img src=x', 'Slower', 'Lower score']);
  expect(savedBoard[2]).toEqual({ name: 'img src=x', score: 120, falls: 4, elapsed: 125 });

  await page.locator('#victory-leaderboard').click();
  await expect(page.locator('#dialog-title')).toHaveText('Leaderboard lokal');
  const rows = page.locator('.leaderboard-table tbody tr');
  await expect(rows).toHaveCount(5);
  expect(await rows.evaluateAll(rows => rows.map(row => Array.from(row.cells, cell => cell.textContent)))).toEqual([
    ['1', 'Fewer falls', '120', '3', '5:00'],
    ['2', 'Faster', '120', '4', '1:40'],
    ['3', 'img src=x', '120', '4', '2:05'],
    ['4', 'Slower', '120', '4', '2:20'],
    ['5', 'Lower score', '110', '0', '0:01'],
  ]);
  // Decorative rank images are allowed; a player's name must remain plain text.
  await expect(page.locator('.leaderboard-table td:nth-child(2) img, #dialog-content script')).toHaveCount(0);
  await expect(page.locator('#dialog-content img')).toHaveCount(3);
  expect(await page.locator('#dialog-content img').evaluateAll(images => images.every(image =>
    new URL(image.src).pathname.startsWith('/assets/ui/') && ['gold', 'silver', 'bronze'].includes(image.dataset.icon)))).toBe(true);
  await page.screenshot({ path: 'test-results/run-leaderboard-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/run-leaderboard-portrait.png', fullPage: true });
  expect(await page.locator('#modal').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);

  await page.reload();
  await page.locator('#continue').click();
  await expect(page.locator('#victory')).toBeVisible();
  await expect(page.locator('#record-result')).toBeDisabled();
  await expect(page.locator('#record-status')).toHaveText('Hasil perjalanan ini sudah dicatat.');
  // The submit handler also rejects duplicate recording, independently of disabled controls.
  await page.locator('#record-form').dispatchEvent('submit');
  expect(await readStored(page, LEADERBOARD_KEY)).toEqual(savedBoard);
  await page.locator('#replay').click();
  await page.getByRole('button', { name: 'Ya, mulai baru', exact: true }).click();
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#health')).toHaveText('3/3');
  expect(await readStored(page, RUN_KEY)).toEqual(createRun());
  expect(await readStored(page, STATE_KEY)).toEqual(freshState());
  expect(await readStored(page, LEADERBOARD_KEY)).toEqual(savedBoard);
});
