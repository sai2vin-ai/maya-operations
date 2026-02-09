import { test, expect } from '@playwright/test';

test.describe('Global Search', () => {
    test('should open search with Ctrl+K', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });

        // Press Ctrl+K to open search
        await page.keyboard.press('Control+k');

        // Search modal should appear with search input
        const searchInput = page.locator('input[placeholder*="Search"]');
        await expect(searchInput.first()).toBeVisible({ timeout: 5000 });
    });

    test('should close search with Escape', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });

        // Open search
        await page.keyboard.press('Control+k');
        const searchInput = page.locator('input[placeholder*="Search"]');
        await expect(searchInput.first()).toBeVisible({ timeout: 5000 });

        // Close with Escape
        await page.keyboard.press('Escape');

        // Search modal should be hidden
        await expect(searchInput.first()).not.toBeVisible({ timeout: 3000 });
    });

    test('search button should be in top bar', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });
        // Search button with title should be visible
        await expect(page.locator('button[title="Search (Ctrl+K)"]')).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Notifications', () => {
    test('should render notifications page', async ({ page }) => {
        await page.goto('/notifications');
        await expect(page.locator('text=/Notification/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should have notification bell in top bar', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });
        const bellButton = page.locator('button[title="Notifications"]');
        await expect(bellButton).toBeVisible({ timeout: 10000 });
    });

    test('bell button should navigate to notifications', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });
        const bellButton = page.locator('button[title="Notifications"]');
        await expect(bellButton).toBeVisible({ timeout: 10000 });
        await bellButton.click();
        await expect(page).toHaveURL(/\/notifications/);
    });
});
