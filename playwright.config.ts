import { defineConfig, devices } from '@playwright/test';

const mobileTests = /.*\.mobile\.spec\.ts/

export default defineConfig({
  testDir: 'tests',
  projects: [{
    name: 'Chromium',
    use: {
      browserName: 'chromium',
    },
    testIgnore: mobileTests,
  }, {
    name: 'Firefox',
    use: {
      browserName: 'firefox',
    },
    testIgnore: mobileTests,
  }, {
    name: 'WebKit',
    use: {
      browserName: 'webkit',
    },
    testIgnore: mobileTests,
  }, {
    name: 'iOS WebKit',
    use: {
      browserName: 'webkit',
      ...devices['iPhone 15'],
    },
    testMatch: mobileTests,
  }, {
    name: 'Android Chromium',
    use: {
      browserName: 'chromium',
      ...devices['Pixel 7'],
    },
    testMatch: mobileTests,
  }],
  fullyParallel: true,
  webServer: {
    command: 'pnpm run preview',
    port: 9000,
    reuseExistingServer: true
  }
})
