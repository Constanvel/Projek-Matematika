import { test, expect } from '@playwright/test';

test('compact HUD leaves the world clear and bottom help is contextual', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/'); await page.locator('#start').click();
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#game')).toHaveAttribute('data-contextual', 'true');
  await expect(page.locator('#interaction')).toContainText('A / D');
  // Move clear of the introductory sign and safe tutorial surfaces.
  await page.keyboard.down('KeyD');
  await expect.poll(async () => Number(await page.locator('#board').getAttribute('data-player-x'))).toBeGreaterThan(150);
  await page.keyboard.up('KeyD');
  const footprint = await page.evaluate(() => {
    const rect = selector => { const b = document.querySelector(selector).getBoundingClientRect(); return { w: b.width, h: b.height }; };
    return { title: rect('.game-heading > div'), hud: rect('.hud'), bottom: rect('.game-bottom'),
      titleFont: parseFloat(getComputedStyle(document.getElementById('level-title')).fontSize) };
  });
  expect(footprint.title.w).toBeLessThan(250);
  expect(footprint.hud.h).toBeLessThan(45);
  expect(footprint.hud.w).toBeLessThan(340);
  expect(footprint.bottom.h).toBeLessThan(75);
  expect(footprint.bottom.w).toBeLessThan(590);
  expect(footprint.titleFont).toBeLessThanOrEqual(14);
  await page.screenshot({ path: 'test-results/compact-hud-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/compact-hud-portrait.png', fullPage: true });
});
