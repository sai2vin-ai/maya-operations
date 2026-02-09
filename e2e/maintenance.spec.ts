import { test, expect } from '@playwright/test';

test.describe('Maintenance', () => {
    test('should render maintenance dashboard', async ({ page }) => {
        await page.goto('/maintenance');
        await expect(page.locator('text=/Maintenance/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('dashboard should have Assets and Work Orders tabs', async ({ page }) => {
        await page.goto('/maintenance');
        await expect(page.locator('text=/Maintenance/i').first()).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=/Assets/i').first()).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=/Work Orders/i').first()).toBeVisible();
    });

    test('should navigate to asset create form', async ({ page }) => {
        await page.goto('/maintenance/assets/new');
        await expect(page.locator('text=/Register Asset|New Asset|Asset/i').first()).toBeVisible({ timeout: 15000 });
    });

    test('asset create form should have required fields', async ({ page }) => {
        await page.goto('/maintenance/assets/new');
        await expect(page.locator('text=/Register Asset|New Asset|Asset/i').first()).toBeVisible({ timeout: 15000 });
        // Should have name input, category select, location select
        await expect(page.locator('text=/Asset Name|Name/i').first()).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=/Category/i').first()).toBeVisible();
        await expect(page.locator('text=/Location/i').first()).toBeVisible();
    });

    test('should navigate to job create form', async ({ page }) => {
        await page.goto('/maintenance/jobs/new');
        await expect(page.locator('text=/Create Work Order/i').first()).toBeVisible({ timeout: 10000 });
    });
});
