import { test, expect } from '@playwright/test';

test.describe('Quality Control', () => {
    test('should render quality dashboard', async ({ page }) => {
        await page.goto('/quality');
        await expect(page.locator('text=/Quality Control/i')).toBeVisible({ timeout: 10000 });
    });

    test('dashboard should have new QC check button', async ({ page }) => {
        await page.goto('/quality');
        await expect(page.locator('text=/Quality Control/i')).toBeVisible({ timeout: 10000 });
        const newButton = page.locator('text=/New QC|New Check|\\+ New/i').first();
        await expect(newButton).toBeVisible({ timeout: 10000 });
    });

    test('dashboard should have status filter', async ({ page }) => {
        await page.goto('/quality');
        await expect(page.locator('text=/Quality Control/i')).toBeVisible({ timeout: 10000 });
        // Status filter select
        const select = page.locator('select');
        await expect(select.first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to quality check create form', async ({ page }) => {
        await page.goto('/quality/new');
        await expect(page.locator('text=/New|Create|Quality|Check/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('create form should have batch selector', async ({ page }) => {
        await page.goto('/quality/new');
        await expect(page.locator('text=/New|Create|Quality|Check/i').first()).toBeVisible({ timeout: 10000 });
        // Should have batch selection
        await expect(page.locator('text=/Batch/i').first()).toBeVisible({ timeout: 10000 });
        // Should have check type selection
        await expect(page.locator('text=/Check Type|Type/i').first()).toBeVisible();
    });
});
