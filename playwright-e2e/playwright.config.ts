import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: 'src/tests',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'https://ww1.demoaut.com',
    headless: false,
    viewport: { width: 1280, height: 720 },
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 10000,
  },
  reporter: [['html'], ['list']],
};

export default config;