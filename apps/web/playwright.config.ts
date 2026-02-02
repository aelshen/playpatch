import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for RealDebrid Integration Testing
 */
export default defineConfig({
  testDir: './tests',

  // Maximum time one test can run
  timeout: 120 * 1000,

  // Test timeout for assertions
  expect: {
    timeout: 15000
  },

  // Run tests in parallel
  fullyParallel: false, // Sequential for integration tests

  // Fail the build on CI if tests fail
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Number of workers
  workers: 1, // Single worker for integration tests

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:3000',

    // Collect trace on failure
    trace: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'on',

    // Video on failure
    video: 'retain-on-failure',

    // Browser context options
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,

    // Action timeout
    actionTimeout: 15000,

    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for different browsers
  projects: [
    // Setup project for authentication
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // Test project that depends on setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use saved auth state from setup
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Run your local dev server before starting the tests
  // (Assuming it's already running based on prerequisites)
  webServer: undefined, // Dev server should already be running
});
