/**
 * Playwright Authentication Setup
 * Creates an authenticated session before running tests
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

// Test credentials (created by scripts/seed-test-user.ts)
const TEST_ADMIN_CREDENTIALS = {
  email: 'test@playpatch.local',
  password: 'test123',
};

setup('authenticate as admin', async ({ page, context }) => {
  console.log('Setting up authentication...');

  // Navigate to login page
  await page.goto('http://localhost:3000/auth/login');
  await page.waitForLoadState('networkidle');

  // Fill login form
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

  await emailInput.fill(TEST_ADMIN_CREDENTIALS.email);
  await passwordInput.fill(TEST_ADMIN_CREDENTIALS.password);

  // Submit form
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();

  // Wait for successful login and redirect
  await page.waitForURL(/admin|dashboard|content/i, { timeout: 15000 });

  // Verify we're logged in
  await page.goto('http://localhost:3000/admin/content');
  await expect(page).not.toHaveURL(/login/);

  // Save authentication state
  await context.storageState({ path: authFile });

  console.log('✓ Authentication setup complete');
});
