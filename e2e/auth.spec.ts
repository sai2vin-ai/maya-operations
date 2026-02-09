import { test, expect } from '@playwright/test';

test.describe('Authentication (E2E Mode)', () => {
    test('should auto-authenticate and redirect to dashboard', async ({ page }) => {
        await page.goto('/');
        // In E2E mode, user is auto-authenticated and redirected to dashboard
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    });

    test('should display user info in top bar', async ({ page }) => {
        await page.goto('/dashboard');
        // Wait for the page to load by checking for the welcome message
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });
        // The mock user name should appear in the top bar (hidden on mobile)
        await expect(page.locator('header >> text=E2E Test Admin')).toBeVisible({ timeout: 10000 });
    });

    test('should have logout button in top bar', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });
        const logoutButton = page.locator('button[title="Logout"]');
        await expect(logoutButton).toBeVisible({ timeout: 10000 });
    });

    test('should have functional top bar buttons', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });
        // Search, notifications, and logout buttons should all be present
        await expect(page.locator('button[title="Search (Ctrl+K)"]')).toBeVisible();
        await expect(page.locator('button[title="Notifications"]')).toBeVisible();
        await expect(page.locator('button[title="Logout"]')).toBeVisible();
    });
});
