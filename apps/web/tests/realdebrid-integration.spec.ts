import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * RealDebrid Integration Test Suite
 *
 * This comprehensive test suite validates the complete RealDebrid integration
 * following the testing guide in docs/archive/REALDEBRID_TESTING.md
 */

const BASE_URL = 'http://localhost:3000';
const UBUNTU_MAGNET = 'magnet:?xt=urn:btih:6a9759bffd5c0af65319979fb7832189f4f3c356&dn=ubuntu-22.04.1-desktop-amd64.iso';
const INVALID_MAGNET = 'magnet:?xt=urn:btih:invalid';

// Screenshot helper
const takeScreenshot = async (page, name: string) => {
  await page.screenshot({
    path: path.join(__dirname, 'screenshots', `${name}-${Date.now()}.png`),
    fullPage: true
  });
};

test.describe('RealDebrid Integration - Core Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Set longer timeout for RealDebrid API calls
    test.setTimeout(120000); // 2 minutes
  });

  test('Step 1: Access the Import Page', async ({ page }) => {
    console.log('Step 1: Navigating to import page...');

    await page.goto(`${BASE_URL}/admin/content/import`);
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'step1-import-page-loaded');

    // Verify page elements
    await expect(page).toHaveTitle(/Import|Admin/i);

    // Check for YouTube tab
    const youtubeTab = page.locator('button:has-text("YouTube")');
    await expect(youtubeTab).toBeVisible();

    // Check for RealDebrid tab (with magnet icon)
    const realdebridTab = page.locator('button:has-text("RealDebrid")');
    await expect(realdebridTab).toBeVisible();

    console.log('✓ YouTube tab visible');
    console.log('✓ RealDebrid tab visible');

    // Click RealDebrid tab
    await realdebridTab.click();
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'step1-realdebrid-tab-active');

    console.log('✓ RealDebrid tab clicked successfully');
  });

  test('Step 2: Test Magnet Link Preview', async ({ page }) => {
    console.log('Step 2: Testing magnet link preview...');

    await page.goto(`${BASE_URL}/admin/content/import`);
    await page.waitForLoadState('networkidle');

    // Click RealDebrid tab
    const realdebridTab = page.locator('button:has-text("RealDebrid")');
    await realdebridTab.click();
    await page.waitForTimeout(500);

    // Find magnet input field
    const magnetInput = page.locator('input[type="text"], textarea').filter({
      hasText: /magnet/i
    }).or(page.locator('input[placeholder*="magnet" i]'));

    await expect(magnetInput.first()).toBeVisible();
    console.log('✓ Magnet input field present');

    // Enter magnet link
    await magnetInput.first().fill(UBUNTU_MAGNET);
    await takeScreenshot(page, 'step2-magnet-entered');
    console.log('✓ Magnet link entered');

    // Find and click Preview Files button
    const previewButton = page.locator('button', { hasText: /preview.*files/i });
    await expect(previewButton).toBeVisible();
    console.log('✓ Preview Files button present');

    await previewButton.click();
    console.log('✓ Preview Files button clicked');

    // Wait for API call and file list (5-10 seconds)
    await page.waitForTimeout(8000);
    await takeScreenshot(page, 'step2-files-loading');

    // Check for file list elements
    const fileList = page.locator('[role="list"], .file-list, ul').first();
    await expect(fileList).toBeVisible({ timeout: 15000 });

    // Verify torrent info displayed
    const torrentName = page.locator('text=/ubuntu|torrent|name/i').first();
    await expect(torrentName).toBeVisible();
    console.log('✓ Torrent name displayed');

    // Verify file sizes shown
    const fileSizes = page.locator('text=/MB|GB|KB/i').first();
    await expect(fileSizes).toBeVisible();
    console.log('✓ File sizes displayed');

    // Verify checkboxes present
    const checkboxes = page.locator('input[type="checkbox"]');
    await expect(checkboxes.first()).toBeVisible();
    console.log('✓ File selection checkboxes present');

    await takeScreenshot(page, 'step2-files-previewed');
  });

  test('Step 3: Test File Selection', async ({ page }) => {
    console.log('Step 3: Testing file selection...');

    await page.goto(`${BASE_URL}/admin/content/import`);
    const realdebridTab = page.locator('button:has-text("RealDebrid")');
    await realdebridTab.click();

    const magnetInput = page.locator('input[type="text"], textarea').first();
    await magnetInput.fill(UBUNTU_MAGNET);

    const previewButton = page.locator('button', { hasText: /preview.*files/i });
    await previewButton.click();
    await page.waitForTimeout(10000);

    // Get all checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    console.log(`✓ Found ${count} checkboxes`);

    if (count > 0) {
      // Test individual checkbox toggle
      const firstCheckbox = checkboxes.first();
      const initialState = await firstCheckbox.isChecked();
      await firstCheckbox.click();
      await page.waitForTimeout(300);
      const newState = await firstCheckbox.isChecked();
      expect(newState).toBe(!initialState);
      console.log('✓ Checkbox toggle works');

      // Test Select All button (if exists)
      const selectAllButton = page.locator('button', { hasText: /select.*all/i });
      if (await selectAllButton.count() > 0) {
        await selectAllButton.click();
        console.log('✓ Select All button clicked');
        await page.waitForTimeout(300);
      }

      // Test Select None button (if exists)
      const selectNoneButton = page.locator('button', { hasText: /select.*none|deselect/i });
      if (await selectNoneButton.count() > 0) {
        await selectNoneButton.click();
        console.log('✓ Select None button clicked');
        await page.waitForTimeout(300);
      }

      // Ensure at least one is selected for import
      await firstCheckbox.click();
    }

    await takeScreenshot(page, 'step3-file-selection-tested');
  });

  test('Step 4: Test Import', async ({ page }) => {
    console.log('Step 4: Testing import process...');

    await page.goto(`${BASE_URL}/admin/content/import`);
    const realdebridTab = page.locator('button:has-text("RealDebrid")');
    await realdebridTab.click();

    const magnetInput = page.locator('input[type="text"], textarea').first();
    await magnetInput.fill(UBUNTU_MAGNET);

    const previewButton = page.locator('button', { hasText: /preview.*files/i });
    await previewButton.click();
    await page.waitForTimeout(10000);

    // Ensure at least one file is selected
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (!(await checkbox.isChecked())) {
      await checkbox.click();
    }

    await takeScreenshot(page, 'step4-before-import');

    // Find and click Import button
    const importButton = page.locator('button', { hasText: /import.*selected/i });
    await expect(importButton).toBeVisible();
    await expect(importButton).toBeEnabled();
    console.log('✓ Import button present and enabled');

    await importButton.click();
    console.log('✓ Import button clicked');

    // Wait for import processing (10-30 seconds)
    await page.waitForTimeout(15000);

    // Check for success message
    const successMessage = page.locator('text=/success|imported|video/i').first();
    await expect(successMessage).toBeVisible({ timeout: 30000 });
    console.log('✓ Success message displayed');

    await takeScreenshot(page, 'step4-import-success');

    // Check for redirect countdown or auto-redirect
    const hasRedirect = await page.locator('text=/redirect|seconds/i').count() > 0;
    if (hasRedirect) {
      console.log('✓ Redirect countdown visible');
    }

    // Wait for redirect or navigate manually
    await page.waitForTimeout(5000);
    const currentUrl = page.url();
    if (!currentUrl.includes('/admin/content')) {
      await page.goto(`${BASE_URL}/admin/content`);
    }

    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'step4-redirected-to-content');
  });

  test('Step 5: Verify Video Records', async ({ page }) => {
    console.log('Step 5: Verifying video records...');

    await page.goto(`${BASE_URL}/admin/content`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await takeScreenshot(page, 'step5-content-library');

    // Look for RealDebrid badge (magnet icon)
    const realdebridBadge = page.locator('text=/🧲|realdebrid/i').first();

    if (await realdebridBadge.count() > 0) {
      await expect(realdebridBadge).toBeVisible();
      console.log('✓ RealDebrid badge visible');
    } else {
      console.log('⚠ No RealDebrid videos found (may have been imported in previous test)');
    }

    // Look for PENDING status
    const pendingStatus = page.locator('text=/pending/i').first();
    if (await pendingStatus.count() > 0) {
      console.log('✓ Video with PENDING status found');
    }

    // Check for video cards
    const videoCards = page.locator('[class*="video-card"], [class*="VideoCard"], article').first();
    if (await videoCards.count() > 0) {
      console.log('✓ Video cards displayed');
    }

    await takeScreenshot(page, 'step5-video-records-verified');
  });

  test('Step 6: Test Approval Flow', async ({ page }) => {
    console.log('Step 6: Testing approval flow...');

    // Navigate to approval page
    await page.goto(`${BASE_URL}/admin/content/approval`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await takeScreenshot(page, 'step6-approval-page');

    // Look for RealDebrid videos awaiting approval
    const realdebridVideo = page.locator('[class*="video"], article').filter({
      hasText: /🧲|realdebrid|pending/i
    }).first();

    if (await realdebridVideo.count() > 0) {
      console.log('✓ RealDebrid video found in approval queue');

      // Click on video to see details
      await realdebridVideo.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'step6-video-details');

      // Find and click Approve button
      const approveButton = page.locator('button', { hasText: /approve/i }).first();

      if (await approveButton.count() > 0) {
        await expect(approveButton).toBeVisible();
        await expect(approveButton).toBeEnabled();
        console.log('✓ Approve button found');

        await approveButton.click();
        console.log('✓ Approve button clicked');

        await page.waitForTimeout(2000);

        // Verify status changed to DOWNLOADING
        const downloadingStatus = page.locator('text=/downloading/i');
        if (await downloadingStatus.count() > 0) {
          console.log('✓ Status changed to DOWNLOADING');
        }

        await takeScreenshot(page, 'step6-video-approved');
      } else {
        console.log('⚠ No Approve button found');
      }
    } else {
      console.log('⚠ No RealDebrid videos awaiting approval');
    }
  });
});

test.describe('RealDebrid Integration - Error Handling', () => {

  test('Step 10a: Invalid Magnet Link', async ({ page }) => {
    console.log('Step 10a: Testing invalid magnet link...');

    await page.goto(`${BASE_URL}/admin/content/import`);
    const realdebridTab = page.locator('button:has-text("RealDebrid")');
    await realdebridTab.click();

    const magnetInput = page.locator('input[type="text"], textarea').first();
    await magnetInput.fill(INVALID_MAGNET);

    await takeScreenshot(page, 'step10a-invalid-magnet-entered');

    const previewButton = page.locator('button', { hasText: /preview.*files/i });
    await previewButton.click();

    // Wait for error message
    await page.waitForTimeout(5000);

    // Look for error message
    const errorMessage = page.locator('text=/error|invalid|failed/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 15000 });
    console.log('✓ Error message displayed for invalid magnet');

    await takeScreenshot(page, 'step10a-error-displayed');

    // Verify no crash or hanging
    const inputStillVisible = await magnetInput.isVisible();
    expect(inputStillVisible).toBe(true);
    console.log('✓ UI remains functional after error');
  });

  test('Step 10b: Empty File Selection', async ({ page }) => {
    console.log('Step 10b: Testing empty file selection...');

    await page.goto(`${BASE_URL}/admin/content/import`);
    const realdebridTab = page.locator('button:has-text("RealDebrid")');
    await realdebridTab.click();

    const magnetInput = page.locator('input[type="text"], textarea').first();
    await magnetInput.fill(UBUNTU_MAGNET);

    const previewButton = page.locator('button', { hasText: /preview.*files/i });
    await previewButton.click();
    await page.waitForTimeout(10000);

    // Deselect all files
    const selectNoneButton = page.locator('button', { hasText: /select.*none|deselect/i });
    if (await selectNoneButton.count() > 0) {
      await selectNoneButton.click();
    } else {
      // Manually uncheck all
      const checkboxes = page.locator('input[type="checkbox"]:checked');
      const count = await checkboxes.count();
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).click();
      }
    }

    await takeScreenshot(page, 'step10b-no-files-selected');

    // Try to import
    const importButton = page.locator('button', { hasText: /import.*selected/i });
    await importButton.click();

    // Look for validation error
    const validationError = page.locator('text=/select.*file|no.*file|at least one/i').first();
    await expect(validationError).toBeVisible({ timeout: 5000 });
    console.log('✓ Validation error displayed for empty selection');

    await takeScreenshot(page, 'step10b-validation-error');
  });
});

test.describe('RealDebrid Integration - Edge Cases', () => {

  test.skip('Edge Case 1: Multi-File Torrents', async ({ page }) => {
    console.log('Edge Case 1: Testing multi-file torrent...');
    // Skip for now - requires specific multi-file torrent
  });

  test.skip('Edge Case 2: Large Files', async ({ page }) => {
    console.log('Edge Case 2: Testing large files...');
    // Skip for now - requires large file torrent and extended timeout
  });

  test.skip('Edge Case 3: Already Imported', async ({ page }) => {
    console.log('Edge Case 3: Testing duplicate import...');
    // Skip for now - requires pre-existing import
  });
});
