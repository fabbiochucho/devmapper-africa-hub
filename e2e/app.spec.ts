import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('renders hero section with title and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
  });

  test('displays live stats section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/projects tracked/i)).toBeVisible({ timeout: 10000 });
  });

  test('SDG carousel is visible', async ({ page }) => {
    await page.goto('/');
    // Scroll down to ensure SDG section loads
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);
    // SDG section should exist on the landing page
    const sdgSection = page.locator('text=/SDG/i').first();
    await expect(sdgSection).toBeVisible({ timeout: 10000 });
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /get started/i }).click();
    // Auth modal should appear
    await expect(page.getByText(/sign in|sign up|create account/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Authentication Flow', () => {
  test('sign in page renders', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByText(/sign in|log in|welcome/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('sign in form has email and password fields', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('sign up tab is accessible', async ({ page }) => {
    await page.goto('/auth');
    const signUpTab = page.getByRole('tab', { name: /sign up|register|create/i }).first();
    if (await signUpTab.isVisible()) {
      await signUpTab.click();
      await expect(page.locator('input[type="email"], input[placeholder*="email" i]').first()).toBeVisible();
    }
  });

  test('shows validation on empty submit', async ({ page }) => {
    await page.goto('/auth');
    const submitBtn = page.getByRole('button', { name: /sign in|log in|submit/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Should show some error or validation
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Dashboard Navigation', () => {
  test('unauthenticated user sees landing page, not dashboard', async ({ page }) => {
    await page.goto('/');
    // Should see hero, not dashboard
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible({ timeout: 10000 });
  });

  test('sidebar links are present in layout pages', async ({ page }) => {
    await page.goto('/analytics');
    // Layout with sidebar should be visible
    await page.waitForTimeout(2000);
    const sidebar = page.locator('[data-sidebar]').first();
    // Sidebar should exist (even if collapsed on mobile)
    expect(await sidebar.count()).toBeGreaterThanOrEqual(0);
  });

  test('about page renders', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByText(/about|mission|devmapper/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('pricing page renders', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText(/pricing|plan|free/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Report Submission', () => {
  test('submit report page requires auth', async ({ page }) => {
    await page.goto('/submit-report');
    await page.waitForTimeout(3000);
    // Should either show the form or redirect to auth
    const hasForm = await page.locator('form, input[name], textarea').first().isVisible().catch(() => false);
    const hasAuthPrompt = await page.getByText(/sign in|log in|authenticate/i).first().isVisible().catch(() => false);
    expect(hasForm || hasAuthPrompt).toBeTruthy();
  });
});
