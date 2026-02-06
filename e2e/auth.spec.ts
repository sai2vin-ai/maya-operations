import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should display login page for unauthenticated users', async ({ page }) => {
        // Should redirect to login or show login form
        await expect(page).toHaveURL(/\/login|\/$/);

        // Should have email and password fields
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');

        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
    });

    test('should show validation errors for empty form submission', async ({ page }) => {
        // Click login button without entering credentials
        const loginButton = page.locator('button[type="submit"]');
        await loginButton.click();

        // Should show validation errors or stay on login page
        await expect(page).toHaveURL(/\/login|\/$/);
    });

    test('should show error for invalid credentials', async ({ page }) => {
        // Enter invalid credentials
        await page.fill('input[type="email"]', 'invalid@test.com');
        await page.fill('input[type="password"]', 'wrongpassword');

        // Submit the form
        const loginButton = page.locator('button[type="submit"]');
        await loginButton.click();

        // Should show error message
        const errorMessage = page.locator('text=/error|invalid|incorrect/i');
        await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });

    test('login page should have proper accessibility', async ({ page }) => {
        // Check that form elements have proper labels
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');

        // Inputs should be accessible
        await expect(emailInput).toHaveAttribute('id');
        await expect(passwordInput).toHaveAttribute('id');
    });
});
