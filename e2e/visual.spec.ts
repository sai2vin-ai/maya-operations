import { test, expect } from '@playwright/test';

// Visual regression snapshots are platform-specific (fonts, anti-aliasing differ
// between Windows/Linux/macOS), so skip screenshot comparison on CI.
const skipSnapshotOnCI = !!process.env.CI;

test.describe('Visual Regression', () => {
    test('dashboard should render with glass-card styling', async ({ page }) => {
        await page.goto('/dashboard');

        // Wait for dashboard to fully load
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });

        // Dashboard should have glass-card styled elements
        const glassCards = page.locator('.glass-card');
        await expect(glassCards.first()).toBeVisible({ timeout: 10000 });

        if (!skipSnapshotOnCI) {
            await page.waitForTimeout(500);
            await expect(page).toHaveScreenshot('dashboard.png', {
                maxDiffPixels: 200,
            });
        }
    });

    test('top bar should be styled correctly', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });

        // Top bar header element
        const header = page.locator('header').first();
        await expect(header).toBeVisible({ timeout: 10000 });

        // Should contain action buttons (search, theme, bug report, guide, notifications, logout)
        const buttons = header.locator('button');
        const count = await buttons.count();
        expect(count).toBeGreaterThanOrEqual(3);
    });
});
