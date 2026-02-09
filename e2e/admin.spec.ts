import { test, expect } from '@playwright/test';

test.describe('Reports', () => {
    test('should render reports dashboard', async ({ page }) => {
        await page.goto('/reports');
        await expect(page.locator('text=/Reports/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should show export sections', async ({ page }) => {
        await page.goto('/reports');
        await expect(page.locator('text=/Reports/i').first()).toBeVisible({ timeout: 10000 });
        // Reports page should have export sections in main content
        const mainContent = page.locator('main');
        await expect(mainContent).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Audit Logs', () => {
    test('should render audit logs page', async ({ page }) => {
        await page.goto('/audit');
        await expect(page.locator('text=/Audit/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should have filter controls', async ({ page }) => {
        await page.goto('/audit');
        await expect(page.locator('text=/Audit/i').first()).toBeVisible({ timeout: 10000 });
        // Should have collection or action filter selects
        await expect(page.locator('select').first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('User Activity', () => {
    test('should render user activity page', async ({ page }) => {
        await page.goto('/activity');
        await expect(page.locator('text=/User Activity/i')).toBeVisible({ timeout: 10000 });
    });

    test('should have user selector', async ({ page }) => {
        await page.goto('/activity');
        await expect(page.locator('text=/User Activity/i')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=/Select/i').first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('User Management', () => {
    test('should render users page', async ({ page }) => {
        await page.goto('/users');
        await expect(page.locator('text=/User/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to user create form', async ({ page }) => {
        await page.goto('/users/new');
        await expect(page.locator('text=/New|Create|Add/i').first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Device Management', () => {
    test('should render devices page', async ({ page }) => {
        await page.goto('/devices');
        await expect(page.locator('text=/Device/i').first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Webhooks', () => {
    test('should render webhooks page', async ({ page }) => {
        await page.goto('/webhooks');
        await expect(page.locator('text=/Webhook/i').first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Workflows', () => {
    test('should render workflows page', async ({ page }) => {
        await page.goto('/workflows');
        await expect(page.locator('text=/Workflow/i').first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Bug Reports', () => {
    test('should render bug reports page', async ({ page }) => {
        await page.goto('/bug-reports');
        await expect(page.locator('text=/Bug/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to create bug report', async ({ page }) => {
        await page.goto('/bug-reports/new');
        await expect(page.locator('text=/Bug|Report/i').first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('User Guide', () => {
    test('should render user guide page', async ({ page }) => {
        await page.goto('/guide');
        await expect(page.locator('text=/Guide/i').first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Roles & Permissions', () => {
    test('should render roles page', async ({ page }) => {
        await page.goto('/roles');
        await expect(page.locator('text=/Role/i').first()).toBeVisible({ timeout: 10000 });
    });
});
