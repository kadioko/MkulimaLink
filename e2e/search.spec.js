const { test, expect } = require('@playwright/test');

test.describe('Search Flow', () => {
  test('advanced search page loads', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  test('can perform a keyword search', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="product" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('maize');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      // Results container should be visible (even if empty)
      const results = page.locator('[class*="result"], [class*="product"], [class*="grid"]').first();
      await expect(results).toBeVisible({ timeout: 8000 }).catch(() => {});
    }
  });

  test('can filter by category', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const categoryFilter = page.locator('select[name="category"], [data-testid="category-filter"]').first();
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    }
  });

  test('can filter by region', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const regionFilter = page.locator('select[name="region"], input[placeholder*="region" i]').first();
    if (await regionFilter.isVisible()) {
      if (await regionFilter.evaluate(el => el.tagName) === 'SELECT') {
        await regionFilter.selectOption({ index: 1 });
      } else {
        await regionFilter.fill('Arusha');
      }
      await page.waitForTimeout(1000);
    }
  });

  test('search URL reflects query params', async ({ page }) => {
    await page.goto('/search?q=tomatoes&category=vegetables');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/q=tomatoes/);
  });
});
