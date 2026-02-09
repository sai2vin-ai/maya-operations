import { test, expect } from '@playwright/test';

test.describe('Gate Operations', () => {
    test('should render gate entries page', async ({ page }) => {
        await page.goto('/gate');
        await expect(page.locator('text=/Gate/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should have create new entry button', async ({ page }) => {
        await page.goto('/gate');
        await expect(page.locator('text=/Gate/i').first()).toBeVisible({ timeout: 10000 });
        const newButton = page.locator('text=/New Entry/i').first();
        await expect(newButton).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to create gate entry form', async ({ page }) => {
        await page.goto('/gate/new');
        // Form header should show "New Gate Entry"
        await expect(page.locator('text=/New Gate Entry/i')).toBeVisible({ timeout: 10000 });
    });

    test('create form should have required fields', async ({ page }) => {
        await page.goto('/gate/new');
        await expect(page.locator('text=/New Gate Entry/i')).toBeVisible({ timeout: 10000 });

        // Should have entry type buttons (ENTRY/EXIT)
        await expect(page.locator('text=/ENTRY|Entry Type/i').first()).toBeVisible({ timeout: 10000 });
        // Should have vehicle number input
        await expect(page.locator('text=/Vehicle/i').first()).toBeVisible();
    });

    test('should navigate to vehicle tracking page', async ({ page }) => {
        await page.goto('/gate/vehicles');
        await expect(page.locator('text=/Vehicle Tracking/i')).toBeVisible({ timeout: 10000 });
    });

    test('vehicle tracking should have search', async ({ page }) => {
        await page.goto('/gate/vehicles');
        await expect(page.locator('text=/Vehicle Tracking/i')).toBeVisible({ timeout: 10000 });
        // Should have a search input
        const searchInput = page.locator('input[placeholder*="earch"]').or(page.locator('input[type="search"]'));
        await expect(searchInput.first()).toBeVisible({ timeout: 10000 });
    });
});
