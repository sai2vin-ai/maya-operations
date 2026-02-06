import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
    test('should have proper page title', async ({ page }) => {
        await page.goto('/');

        // Check page title contains something meaningful
        await expect(page).toHaveTitle(/Maya|Pyrolysis|Operations/i);
    });

    test('should have responsive design', async ({ page }) => {
        // Test desktop viewport
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/');

        // The page should be visible and not broken
        await expect(page.locator('body')).toBeVisible();

        // Test tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });
        await expect(page.locator('body')).toBeVisible();

        // Test mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(page.locator('body')).toBeVisible();
    });

    test('should not have console errors on load', async ({ page }) => {
        const errors: string[] = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Filter out expected Firebase/auth related console messages
        const unexpectedErrors = errors.filter(
            (error) =>
                !error.includes('Firebase') &&
                !error.includes('auth') &&
                !error.includes('network')
        );

        expect(unexpectedErrors).toHaveLength(0);
    });
});
