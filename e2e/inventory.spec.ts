import { test, expect } from '@playwright/test';

test.describe('Inventory & Spare Parts', () => {
    test('should render inventory page', async ({ page }) => {
        await page.goto('/inventory');
        await expect(page.locator('text=/Inventory/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('inventory should have create button', async ({ page }) => {
        await page.goto('/inventory');
        const newButton = page.locator('text=/New|Add|Create|\\+/i').first();
        await expect(newButton).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to inventory create form', async ({ page }) => {
        await page.goto('/inventory/new');
        await expect(page.locator('text=/New|Add|Create/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should render spare parts page', async ({ page }) => {
        await page.goto('/spare-parts');
        await expect(page.locator('text=/Store|Spare Parts/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to spare part create form', async ({ page }) => {
        await page.goto('/spare-parts/new');
        await expect(page.locator('text=/New|Add|Create/i').first()).toBeVisible({ timeout: 10000 });
    });
});
