import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
    test('should have proper page title', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveTitle(/Maya|Pyrolysis|Operations/i);
    });

    test('should have responsive design', async ({ page }) => {
        // Test desktop viewport
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/dashboard');
        await expect(page.locator('main')).toBeVisible({ timeout: 15000 });

        // Test tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 });
        await expect(page.locator('main')).toBeVisible({ timeout: 5000 });

        // Test mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(page.locator('main')).toBeVisible({ timeout: 5000 });
    });

    test('should not have console errors on dashboard', async ({ page }) => {
        const errors: string[] = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto('/dashboard');
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });

        // Filter out expected Firebase/network related messages
        const unexpectedErrors = errors.filter(
            (error) =>
                !error.includes('Firebase') &&
                !error.includes('firebase') &&
                !error.includes('auth') &&
                !error.includes('network') &&
                !error.includes('firestore') &&
                !error.includes('Failed to fetch') &&
                !error.includes('ERR_NAME_NOT_RESOLVED') &&
                !error.includes('FIRESTORE') &&
                !error.includes('WebChannel') &&
                !error.includes('googleapis')
        );

        expect(unexpectedErrors).toHaveLength(0);
    });

    test('sidebar should show navigation items for SUPER_ADMIN', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/dashboard');
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });

        // Key nav items should be present in the sidebar (inside aside > nav)
        const sidebarNav = page.locator('aside nav');
        await expect(sidebarNav.locator('text=Dashboard').first()).toBeVisible({ timeout: 10000 });
        await expect(sidebarNav.locator('text=Gate Operations').first()).toBeVisible();
        await expect(sidebarNav.locator('text=Reactor Dashboard').first()).toBeVisible();
        await expect(sidebarNav.locator('text=Inventory').first()).toBeVisible();
        await expect(sidebarNav.locator('text=Asset Register').first()).toBeVisible();
        await expect(sidebarNav.locator('text=Work Orders').first()).toBeVisible();
        await expect(sidebarNav.locator('text=Quality Control').first()).toBeVisible();
        await expect(sidebarNav.locator('text=Shift Management').first()).toBeVisible();
    });

    test('sidebar should navigate between pages', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/dashboard');
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });

        const nav = page.locator('nav');

        // Click Gate Operations in sidebar
        await nav.locator('text=Gate Operations').click();
        await expect(page).toHaveURL(/\/gate/);

        // Click Inventory in sidebar (use exact match to avoid "Inventory & Stores" group label)
        await nav.getByRole('button', { name: 'Inventory', exact: true }).click();
        await expect(page).toHaveURL(/\/inventory/);

        // Click Work Orders in sidebar
        await nav.locator('text=Work Orders').click();
        await expect(page).toHaveURL(/\/maintenance/);
    });

    test('mobile hamburger menu should work', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/dashboard');
        await expect(page.locator('text=/Welcome back/i')).toBeVisible({ timeout: 15000 });

        // Hamburger button should be visible on mobile
        const hamburger = page.locator('button[aria-label="Open menu"]');
        await expect(hamburger).toBeVisible({ timeout: 10000 });

        // Click hamburger to open sidebar
        await hamburger.click();

        // Mobile sidebar renders as the last aside (after hidden desktop aside)
        const mobileSidebar = page.locator('aside').last();
        await expect(mobileSidebar.locator('text=Gate Operations')).toBeVisible({ timeout: 5000 });
    });
});
