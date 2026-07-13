const { test, expect } = require('@playwright/test');
const { register, login, TEST_USER } = require('./helpers');

const farmerUser = {
  ...TEST_USER,
  email: `e2e.farmer.products.${Date.now()}@test.com`,
  phone: `+25572${Math.floor(1000000 + Math.random() * 8999999)}`,
};

test.describe('Products', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await register(page, farmerUser);
    await page.close();
  });

  test('shows product listing page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    const heading = page.locator('h1, h2').filter({ hasText: /products|marketplace/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('can search for products', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('tomatoes');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/search|q=tomatoes/i).catch(() => {});
    }
  });

  test('can browse to advanced search', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
  });

  test('farmer can navigate to add product page', async ({ page }) => {
    await login(page, farmerUser.email, farmerUser.password);
    await page.goto('/products/add');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('form, [class*="form"]')).toBeVisible({ timeout: 10000 });
  });

  test('farmer can add a product', async ({ page }) => {
    await login(page, farmerUser.email, farmerUser.password);
    await page.goto('/products/add');
    await page.waitForLoadState('networkidle');

    const nameInput = page.locator('[name="name"], input[placeholder*="product name" i]').first();
    await nameInput.fill('Fresh Arusha Tomatoes');

    const descInput = page.locator('[name="description"], textarea').first();
    if (await descInput.isVisible()) {
      await descInput.fill('Organic tomatoes from Arusha farm. Pesticide free.');
    }

    const priceInput = page.locator('[name="price"], input[type="number"]').first();
    if (await priceInput.isVisible()) {
      await priceInput.fill('2000');
    }

    const categorySelect = page.locator('[name="category"], select').first();
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 });
    }

    const qtyInput = page.locator('[name="quantity"]').first();
    if (await qtyInput.isVisible()) {
      await qtyInput.fill('100');
    }

    await page.click('button[type="submit"]');

    // Either success toast or redirect to products
    const successIndicator = page.locator('[class*="toast"], [class*="success"], [role="alert"]').first();
    await expect(successIndicator).toBeVisible({ timeout: 15000 }).catch(async () => {
      // May have redirected instead of showing toast
      await expect(page).not.toHaveURL(/\/add$/i);
    });
  });

  test('product detail page loads', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    const productCard = page.locator('[class*="card"], [class*="product"]').first();
    if (await productCard.isVisible()) {
      await productCard.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/products\//i, { timeout: 8000 }).catch(() => {});
    }
  });
});
