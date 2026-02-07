import { test, expect } from '@playwright/test';

// Visual regression snapshots are platform-specific (fonts, anti-aliasing differ
// between Windows/Linux/macOS), so skip screenshot comparison on CI and only run
// it locally where the baseline was generated.
const skipSnapshotOnCI = !!process.env.CI;

test.describe('Visual Regression', () => {
    test('login page should match snapshot', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Wait for any animations to complete
        await page.waitForTimeout(500);

        if (skipSnapshotOnCI) {
            // On CI, just verify the page renders without errors
            await expect(page.locator('form')).toBeVisible();
            return;
        }

        // Take a screenshot and compare
        await expect(page).toHaveScreenshot('login-page.png', {
            maxDiffPixels: 100,
        });
    });

    test('login form should be centered and styled correctly', async ({ page }) => {
        await page.goto('/');

        // Check that the login form has proper styling
        const form = page.locator('form').first();
        await expect(form).toBeVisible();

        // Check form container has glass-card styling
        const formContainer = page.locator('.glass-card').first();
        await expect(formContainer).toBeVisible();
    });
});
