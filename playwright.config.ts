import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const telefon = { ...devices['Desktop Chrome'], isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    // Telefonul contează cel mai mult.
    { name: 'telefon', use: { ...telefon, viewport: { width: 390, height: 844 } } },
    { name: 'telefon-mic', use: { ...telefon, viewport: { width: 360, height: 740 } }, testIgnore: /video/ },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } }, testIgnore: /video/ },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    // Fără apeluri la site în teste: orice CUI care nu e demo dă „negasit”.
    env: { ANAF_MOCK: '1' },
  },
});
