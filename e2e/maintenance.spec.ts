import { test, expect } from '@playwright/test';

test.describe('Asset Register', () => {
    test('should render asset register page', async ({ page }) => {
        await page.goto('/assets');
        await expect(page.locator('text=/Asset Register/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should have register asset button', async ({ page }) => {
        await page.goto('/assets');
        await expect(page.locator('text=/Asset Register/i').first()).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=/Register Asset/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to asset create form', async ({ page }) => {
        await page.goto('/assets/new');
        await expect(page.locator('text=/Register Asset/i').first()).toBeVisible({ timeout: 15000 });
    });

    test('asset create form should have required fields', async ({ page }) => {
        await page.goto('/assets/new');
        await expect(page.locator('text=/Register Asset/i').first()).toBeVisible({ timeout: 15000 });
        await expect(page.locator('text=/Asset Name|Name/i').first()).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=/Category/i').first()).toBeVisible();
        await expect(page.locator('text=/Location/i').first()).toBeVisible();
    });
});

test.describe('Maintenance', () => {
    test('should render maintenance dashboard', async ({ page }) => {
        await page.goto('/maintenance');
        await expect(page.locator('text=/Maintenance/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should have create task button', async ({ page }) => {
        await page.goto('/maintenance');
        await expect(page.locator('text=/Maintenance/i').first()).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=/New Task/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to job create form', async ({ page }) => {
        await page.goto('/maintenance/new');
        await expect(page.locator('text=/Create Maintenance Task/i').first()).toBeVisible({ timeout: 10000 });
    });
});
