import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 45000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium', channel: 'msedge', headless: true, viewport: { width: 1100, height: 900 }, screenshot: 'only-on-failure', trace: 'off' },
  webServer: { command: 'npm start', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
