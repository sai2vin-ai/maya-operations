import { test, expect } from '@playwright/test';

test.describe('Weighbridge', () => {
    test('should render weighbridge page', async ({ page }) => {
        await page.goto('/weighbridge');
        await expect(page.locator('text=/Weighbridge/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should have new entry button', async ({ page }) => {
        await page.goto('/weighbridge');
        const newButton = page.locator('text=/New|Record|Create|\\+/i').first();
        await expect(newButton).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to weighbridge entry form', async ({ page }) => {
        await page.goto('/weighbridge/new');
        await expect(page.locator('text=/Weight|Weighbridge/i').first()).toBeVisible({ timeout: 10000 });
    });
});
