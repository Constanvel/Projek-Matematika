import { test, expect } from '@playwright/test';

test('independent sliders restore legacy preferences and persist without touching progress', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('audio-fixture')) return;
    localStorage.setItem('gundul-warrior-audio-v1', JSON.stringify({ muted: false, volume: .6 }));
    sessionStorage.setItem('audio-fixture', 'true');
  });
  await page.goto('/');
  const before = await page.evaluate(() => localStorage.getItem('gundul-warrior-v1'));
  await page.locator('#settings').click();
  await expect(page.getByLabel('Volume utama', { exact: true })).toHaveValue('0.6');
  await expect(page.getByLabel('Musik', { exact: true })).toHaveValue('1');
  await page.getByLabel('Musik', { exact: true }).fill('0.25');
  await page.getByLabel('Efek suara', { exact: true }).fill('0.8');
  await page.getByRole('button', { name: 'Simpan & tutup' }).click();
  await page.reload();
  await page.locator('#settings').click();
  await expect(page.getByLabel('Musik', { exact: true })).toHaveValue('0.25');
  await expect(page.getByLabel('Efek suara', { exact: true })).toHaveValue('0.8');
  expect(await page.evaluate(() => localStorage.getItem('gundul-warrior-v1'))).toBe(before);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.locator('#modal').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/audio-mix-portrait.png', fullPage: true });
});

test('real Web Audio channels stay independent through pause, mute and theme changes', async ({ page }) => {
  await page.goto('/');
  // A real user gesture unlocks Web Audio before exercising the audio class.
  await page.locator('#settings').click();
  const result = await page.evaluate(async () => {
    const { GameAudio } = await import('/js/game/audio.js');
    const audio = new GameAudio({ muted: false, volume: .4, musicVolume: .25, effectsVolume: .8 });
    const started = await audio.start();
    if (!started) return { started };
    // Silent buses can stop processing and retain a stale AudioParam.value.
    const probe = audio.context.createConstantSource(); probe.offset.value = .0001;
    probe.connect(audio.music); probe.connect(audio.effects); probe.start();
    const settle = async () => {
      // Audio hardware can start later than the page clock on headless Windows.
      const start = audio.context.currentTime, deadline = performance.now() + 5000;
      while (audio.context.currentTime - start < .25) {
        if (performance.now() > deadline) throw new Error(`Audio clock stalled: ${audio.context.state}`);
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    };
    const initial = { music: audio.music.gain.value, effects: audio.effects?.gain.value };
    audio.setPaused(true);
    audio.setSettings({ musicVolume: .5, effectsVolume: .6 });
    await settle();
    const paused = { music: audio.music.gain.value, effects: audio.effects.gain.value };
    audio.setTheme('cave'); audio.setPaused(false);
    await settle();
    const resumed = audio.music.gain.value;
    audio.setSettings({ muted: true });
    await settle();
    const muted = audio.master.gain.value;
    audio.setSettings({ muted: false });
    await settle();
    const unmuted = audio.master.gain.value;
    audio.play('coin');
    const effects = [...audio.voices].some(voice => !voice.music);
    probe.stop(); probe.disconnect();
    audio.destroy(); audio.destroy();
    return { started, initial, paused, resumed, muted, unmuted, effects, destroyed: audio.context === null };
  });
  expect(result.started).toBe(true);
  expect(result.initial.music).toBeCloseTo(.25, 5);
  expect(result.initial.effects).toBeCloseTo(.8, 5);
  expect(result.paused.music).toBeLessThan(.001);
  expect(result.paused.effects).toBeCloseTo(.6, 2);
  expect(result.resumed).toBeCloseTo(.5, 2);
  expect(result.muted).toBeLessThan(.001);
  expect(result.unmuted).toBeCloseTo(.2, 2);
  expect(result.effects).toBe(true);
  expect(result.destroyed).toBe(true);
});
