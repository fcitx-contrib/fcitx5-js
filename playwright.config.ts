import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  webServer: {
    command: 'pnpm run preview',
    port: 9000,
    reuseExistingServer: true
  }
})
