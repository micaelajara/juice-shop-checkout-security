import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // tests register/checkout real users; keep it simple and deterministic
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.TARGET_URL ?? 'http://localhost:3000',
  },
});
