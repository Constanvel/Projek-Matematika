import { test, expect } from '@playwright/test';
import { freshState, completeQuestion } from '../../js/state.js';
import { questionsForState } from '../../js/data/question-runs.js';

const key = 'gundul-warrior-v1';
const readState = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);

test('new adventures randomize once; wrong answers, review and reload keep the same exercise', async ({ page }) => {
  await page.goto('/'); await page.locator('#start').click();
  await expect(page.locator('#loading')).toBeHidden();
  const first = await readState(page);
  expect(first.questionSeed).toBeGreaterThan(0); expect(first.questionSetVersion).toBe(1);
  await expect(page.locator('#board')).toBeFocused();
  await page.keyboard.down('KeyD');
  // The introductory steps require jumping too; reach the terminal using real controls.
  for (let jump = 0; jump < 4; jump++) {
    if ((await page.locator('#interaction').textContent()).includes('Jembatan akar')) break;
    await page.keyboard.down('Space'); await page.waitForTimeout(420); await page.keyboard.up('Space');
    await expect(page.locator('#board')).toHaveAttribute('data-grounded', 'true');
  }
  await expect(page.locator('#interaction')).toContainText('Jembatan akar');
  await page.keyboard.up('KeyD'); await page.keyboard.press('KeyE');
  const question = questionsForState(first)[0];
  await expect(page.locator('#question-prompt')).toHaveText(question.prompt);
  await page.screenshot({ path: 'test-results/random-question.png', fullPage: true });
  // Compute the answer independently from the question shown to the player.
  const [, a, b, n] = question.prompt.match(/f\(x\) = (\d+)x \+ (\d+), berapakah f\((\d+)\)/);
  await page.locator('#answer').fill('999999');
  await page.locator('#check').click();
  await expect(page.locator('#feedback')).toContainText('Belum tepat');
  await expect(page.locator('#question-prompt')).toHaveText(question.prompt);
  await page.locator('#answer').fill(String(Number(a) * Number(n) + Number(b)));
  await page.locator('#check').click();
  await expect(page.locator('#feedback')).toContainText('Benar!');
  await page.getByRole('button', { name: 'Lanjut menjelajah' }).click();
  await page.reload(); await page.locator('#continue').click();
  await expect(page.locator('#loading')).toBeHidden(); await page.keyboard.press('KeyE');
  await expect(page.locator('#question-prompt')).toHaveText(question.prompt);
  await expect(page.locator('#check')).toBeDisabled();
  expect((await readState(page)).questionSeed).toBe(first.questionSeed);
  expect((await readState(page)).attempts.q1).toBe(2);
  await page.getByRole('button', { name: 'Kembali menjelajah' }).click();
  await page.locator('#pause').click(); await page.getByRole('button', { name: 'Menu utama', exact: true }).click();
  await page.locator('#start').click(); await page.getByRole('button', { name: 'Ya, mulai baru' }).click();
  await expect(page.locator('#loading')).toBeHidden();
  const second = await readState(page);
  expect(second.questionSeed).not.toBe(first.questionSeed);
  expect(second.solved).toEqual([]);
  expect(questionsForState(second).map(q => q.prompt)).not.toEqual(questionsForState(first).map(q => q.prompt));
});

test('pre-randomization saves retain their original questions and progress', async ({ page }) => {
  const state = freshState(); state.attempts.q1 = 1; completeQuestion(state, 'q1');
  await page.addInitScript(state => localStorage.setItem('gundul-warrior-v1', JSON.stringify(state)), state);
  await page.goto('/'); await page.locator('#continue').click();
  await expect(page.locator('#loading')).toBeHidden(); await page.keyboard.press('KeyE');
  await expect(page.locator('#question-prompt')).toHaveText('Jika f(x) = 2x + 3, berapakah f(4)?');
  await expect(page.locator('#feedback')).toContainText('11');
  await expect(page.locator('#score')).toHaveText('10');
  expect((await readState(page)).questionSeed).toBeUndefined();
});
