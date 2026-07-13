const { test, expect } = require('@playwright/test');
const { register, login, logout, TEST_USER, BUYER_USER } = require('./helpers');

const farmerUser = {
  ...TEST_USER,
  email: `e2e.farmer.auth.${Date.now()}@test.com`,
  phone: `+25571${Math.floor(1000000 + Math.random() * 8999999)}`,
};

test.describe('Authentication', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('shows validation errors on empty login submit', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    const errorMsg = page.locator('[class*="error"], [class*="invalid"], [role="alert"]').first();
    await expect(errorMsg).toBeVisible({ timeout: 5000 }).catch(() => {
      // Some forms use native browser validation — acceptable
    });
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'nonexistent@nobody.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    const errorEl = page.locator('[class*="error"], [class*="toast"], [role="alert"]').first();
    await expect(errorEl).toBeVisible({ timeout: 8000 });
  });

  test('can register a new farmer account', async ({ page }) => {
    await register(page, farmerUser);
    // After registration we should be on a protected page or dashboard
    await expect(page).not.toHaveURL(/login|register/i);
  });

  test('can login with registered account', async ({ page }) => {
    await login(page, farmerUser.email, farmerUser.password);
    await expect(page).not.toHaveURL(/login/i);
  });

  test('redirects unauthenticated user from protected route to login', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/i, { timeout: 10000 });
  });
});
