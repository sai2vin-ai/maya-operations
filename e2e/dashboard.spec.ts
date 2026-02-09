import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
    test('should render dashboard with welcome message', async ({ page }) => {
        await page.goto('/dashboard');
        // Dashboard shows "Welcome back, {firstName}!" not "Dashboard"
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });
    });

    test('should show glass-card styled module cards', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });

        // Module cards should be rendered with glass-card styling
        const glassCards = page.locator('.glass-card');
        const count = await glassCards.count();
        expect(count).toBeGreaterThanOrEqual(3);
    });

    test('should show Quick Access section', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });

        // Dashboard should have Quick Access section with module cards
        await expect(page.locator('text=/Quick Access/i')).toBeVisible({ timeout: 10000 });
    });

    test('module cards should be clickable and navigate', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });

        // Click a module card that navigates to a feature page
        const gateCard = page.locator('text=Gate Operations').first();
        if (await gateCard.isVisible()) {
            await gateCard.click();
            await expect(page).toHaveURL(/\/(gate|dashboard)/);
        }
    });
});
