import { test, expect } from '@playwright/test';

const key = 'gundul-warrior-v1';
async function start(page) {
  await page.goto('/');
  await page.screenshot({ path: 'test-results/home.png', fullPage: true });
  await page.getByRole('button', { name: 'Mulai petualangan' }).click();
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#board')).toBeFocused();
}
async function travelUntil(page, text) {
  await expect(page.locator('#modal')).toBeHidden();
  await expect(page.locator('#board')).toHaveAttribute('data-paused', 'false');
  await page.locator('#board').focus();
  await page.keyboard.up('KeyD');
  await page.keyboard.down('KeyD');
  let lastX = -1;
  for (let i = 0; i < 140; i++) {
    if ((await page.locator('#interaction').textContent()).includes(text)) {
      await page.keyboard.up('KeyD'); return;
    }
    const x = Number(await page.locator('#board').getAttribute('data-player-x'));
    if (x === lastX) {
      await page.keyboard.down('Space');
      await page.waitForTimeout(420);
      await page.keyboard.up('Space');
    }
    lastX = x;
    await page.waitForTimeout(120);
  }
  await page.keyboard.up('KeyD');
  throw new Error(`Tidak mencapai ${text}`);
}
async function answer(page, question) {
  await expect(page.locator('#modal')).toBeVisible();
  if (question.type === 'number') await page.locator('#answer').fill(String(question.answer));
  else await page.locator(`input[value="${question.answer}"]`).check();
  await page.getByRole('button', { name: 'Periksa jawaban' }).click();
  await expect(page.locator('#feedback')).toContainText('Benar!');
  await page.getByRole('button', { name: 'Lanjut menjelajah' }).click();
  await expect(page.locator('#modal')).toBeHidden();
  await expect(page.locator('#board')).toHaveAttribute('data-paused', 'false');
  await expect(page.locator('#board')).toBeFocused();
}

test('assets, movement, jump, pause, wrong answers, review and reload', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => { errors.push(error.message); console.error(error.stack); });
  await start(page);
  await expect(page.locator('#level-title')).toHaveText('Hutan Fungsi');
  await expect(page.locator('#score')).toHaveText('0');
  await travelUntil(page, 'Jembatan akar');
  await page.keyboard.press('KeyE');
  const stoppedX = await page.locator('#board').getAttribute('data-player-x');
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(180);
  await page.keyboard.up('KeyD');
  expect(await page.locator('#board').getAttribute('data-player-x')).toBe(stoppedX);
  await page.locator('#answer').fill('0');
  await page.getByRole('button', { name: 'Periksa jawaban' }).click();
  await expect(page.locator('#feedback')).toContainText('Belum tepat');
  await expect(page.locator('#score')).toHaveText('0');
  await page.getByRole('button', { name: 'Petunjuk', exact: true }).click();
  await expect(page.locator('#hint-text')).toBeVisible();
  const { questions } = await import('../../js/data/questions.js');
  await answer(page, questions[0]);
  await expect(page.locator('#score')).toHaveText('10');
  await page.keyboard.press('KeyE');
  await expect(page.locator('#dialog-kicker')).toContainText('TINJAU');
  await expect(page.locator('#check')).toBeDisabled();
  await page.getByRole('button', { name: 'Kembali menjelajah' }).click();
  await expect(page.locator('#modal')).toBeHidden();
  await expect(page.locator('#board')).toHaveAttribute('data-paused', 'false');
  await expect(page.locator('#board')).toBeFocused();
  await page.locator('#pause').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('#dialog-title')).toHaveText('Tarik napas sebentar.');
  await page.getByRole('button', { name: 'Lanjut bermain' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#score')).toHaveText('10');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  expect(saved.attempts.q1).toBe(2);
  expect(saved.checkpoint).toBe('machine-q1');
  expect(saved.phase).toBe('journey');
  expect(errors).toEqual([]);
});

test('all twelve questions through real level travel, checkpoints and victory', async ({ page }) => {
  test.setTimeout(240000);
  const errors = []; page.on('pageerror', error => { errors.push(error.message); console.error(error.stack); });
  await start(page);
  const { questions } = await import('../../js/data/questions.js');
  const { levels } = await import('../../js/data/levels.js');
  for (let index = 0; index < levels.length; index++) {
    const level = levels[index];
    for (const gate of level.gates) {
      // Traverse actual platforms; jump when a ledge blocks horizontal movement.
      await travelUntil(page, gate.label);
      await page.keyboard.press('KeyE');
      await answer(page, questions.find(q => q.id === gate.questionId));
      if (gate.questionId === 'q4') {
        await page.screenshot({ path: 'test-results/composition-machines.png', fullPage: true });
        await page.keyboard.press('KeyE');
        await expect(page.locator('#machine-flow')).toContainText('g(4) = 3');
        await expect(page.locator('#machine-flow')).toContainText('f(3) = 9');
        await page.getByRole('button', { name: 'Kembali menjelajah' }).click();
        await expect(page.locator('#modal')).toBeHidden();
        await expect(page.locator('#board')).toHaveAttribute('data-paused', 'false');
      }
    }
    await travelUntil(page, index === 2 ? 'Peti harta' : 'Wilayah selesai');
    const checkpoint = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).checkpoint, key);
    expect(checkpoint).not.toBe('start');
    if (index === 0) {
      await page.reload();
      await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
      await expect(page.locator('#loading')).toBeHidden();
      await expect(page.locator('#score')).toHaveText('30');
      await expect(page.locator('#checkpoint-status')).toContainText(checkpoint);
      await travelUntil(page, 'Wilayah selesai');
    }
    await page.screenshot({ path: `test-results/region-${index + 1}.png`, fullPage: true });
    await page.keyboard.press('KeyE');
    if (index < 2) {
      await page.getByRole('button', { name: 'Lanjut ke wilayah berikutnya' }).click();
      await expect(page.locator('#level-title')).toHaveText(levels[index + 1].name);
      await expect(page.locator('#loading')).toBeHidden();
    }
  }
  await expect(page.locator('#victory')).toBeVisible();
  await expect(page.locator('#final-stats')).toContainText('120/120');
  await expect(page.locator('#final-stats')).toContainText('3/3');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  expect(saved.won).toBe(true); expect(saved.solved).toHaveLength(12);
  await page.reload();
  await page.getByRole('button', { name: 'Lanjutkan', exact: true }).click();
  await expect(page.locator('#victory')).toBeVisible();
  await page.getByRole('button', { name: 'Petualangan baru', exact: true }).click();
  await expect(page.locator('#dialog-title')).toHaveText('Mulai perjalanan baru?');
  await page.getByRole('button', { name: 'Batalkan', exact: true }).click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).won, key)).toBe(true);
  expect(errors).toEqual([]);
});

test('asset failure is recoverable without starting a broken session', async ({ page }) => {
  await page.route('**/processed/*.png', route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Mulai petualangan' }).click();
  await expect(page.locator('#retry')).toBeVisible();
  await expect(page.locator('#loading-text')).toContainText('Aset belum dapat dimuat');
  await page.unroute('**/processed/*.png');
  await page.locator('#retry').click();
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#board')).toBeFocused();
});

test('pause requested during loading survives asset completion', async ({ page }) => {
  let release;
  const blocked = new Promise(resolve => { release = resolve; });
  await page.route('**/processed/*.png', async route => { await blocked; await route.continue(); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Mulai petualangan' }).click();
  await expect(page.locator('#loading')).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  release();
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#dialog-title')).toHaveText('Tarik napas sebentar.');
  await expect(page.locator('#board')).toHaveAttribute('data-paused', 'true');
  await page.getByRole('button', { name: 'Lanjut bermain' }).click();
  await expect(page.locator('#board')).toHaveAttribute('data-paused', 'false');
});

test('mobile layout and simultaneous touch controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page);
  // Dispatch independent pointer sources to check holding right while jumping.
  await page.locator('[data-control="right"]').dispatchEvent('pointerdown', { pointerId: 11, button: 0, bubbles: true });
  await page.locator('[data-control="jump"]').dispatchEvent('pointerdown', { pointerId: 12, button: 0, bubbles: true });
  await page.waitForTimeout(300);
  await page.locator('[data-control="jump"]').dispatchEvent('pointerup', { pointerId: 12, bubbles: true });
  await page.locator('[data-control="right"]').dispatchEvent('pointerup', { pointerId: 11, bubbles: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});
