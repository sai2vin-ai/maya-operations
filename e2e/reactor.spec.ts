import { test, expect } from '@playwright/test';

test.describe('Reactor Operations', () => {
    test('should render reactor dashboard', async ({ page }) => {
        await page.goto('/reactor');
        await expect(page.locator('text=/Reactor/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to reactor output page', async ({ page }) => {
        await page.goto('/reactor/output');
        await expect(page.locator('text=/Output/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should render batch analytics page', async ({ page }) => {
        await page.goto('/reactor/analytics');
        await expect(page.locator('text=/Batch Analytics/i')).toBeVisible({ timeout: 10000 });
    });

    test('batch analytics should have period selector', async ({ page }) => {
        await page.goto('/reactor/analytics');
        await expect(page.locator('text=/Batch Analytics/i')).toBeVisible({ timeout: 10000 });
        // Should have period selection buttons (Last 7 Days, Last 30 Days, Last 90 Days)
        await expect(page.locator('text=/7 Days|30 Days|90 Days/i').first()).toBeVisible({ timeout: 10000 });
    });
});
