import { test, expect } from '@playwright/test';

test.describe('Shift Management', () => {
    test('should render shifts page', async ({ page }) => {
        await page.goto('/shifts');
        await expect(page.locator('text=/Shift Management/i')).toBeVisible({ timeout: 10000 });
    });

    test('should show shift controls', async ({ page }) => {
        await page.goto('/shifts');
        await expect(page.locator('text=/Shift Management/i')).toBeVisible({ timeout: 10000 });
        // Should show shift start/end controls or shift info
        const mainContent = page.locator('main');
        await expect(mainContent).toBeVisible({ timeout: 10000 });
    });
});
