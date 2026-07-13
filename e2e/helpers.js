const { expect } = require('@playwright/test');

const TEST_USER = {
  name: 'E2E Test Farmer',
  email: `e2e.farmer.${Date.now()}@test.mkulimalink.com`,
  phone: `+2557${Math.floor(10000000 + Math.random() * 89999999)}`,
  password: 'Test@12345',
  role: 'farmer',
  region: 'Arusha',
  district: 'Arusha Urban',
};

const BUYER_USER = {
  name: 'E2E Test Buyer',
  email: `e2e.buyer.${Date.now()}@test.mkulimalink.com`,
  phone: `+2557${Math.floor(10000000 + Math.random() * 89999999)}`,
  password: 'Test@12345',
  role: 'buyer',
  region: 'Dar es Salaam',
  district: 'Ilala',
};

async function register(page, user = TEST_USER) {
  await page.goto('/register');
  await page.waitForLoadState('networkidle');

  await page.fill('[name="name"], input[placeholder*="name" i]', user.name);
  await page.fill('[name="email"], input[type="email"]', user.email);
  await page.fill('[name="phone"], input[placeholder*="phone" i]', user.phone);
  await page.fill('[name="password"], input[type="password"]', user.password);

  const roleSelect = page.locator('[name="role"], select').first();
  if (await roleSelect.isVisible()) {
    await roleSelect.selectOption(user.role);
  }

  const regionInput = page.locator('[name="location.region"], [name="region"]').first();
  if (await regionInput.isVisible()) {
    await regionInput.fill(user.region);
  }

  await page.click('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")');
  await page.waitForURL(/dashboard|home|\/$/i, { timeout: 15000 }).catch(() => {});
  return user;
}

async function login(page, email, password = TEST_USER.password) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('[name="email"], input[type="email"]', email);
  await page.fill('[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
  await page.waitForURL(/dashboard|home|\/$/i, { timeout: 15000 }).catch(() => {});
}

async function logout(page) {
  const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [data-testid="logout"]');
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
  } else {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/login');
  }
}

module.exports = { TEST_USER, BUYER_USER, register, login, logout };
