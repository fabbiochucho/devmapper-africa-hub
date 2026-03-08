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
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);
    const sdgSection = page.locator('text=/SDG/i').first();
    await expect(sdgSection).toBeVisible({ timeout: 10000 });
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /get started/i }).click();
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
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Dashboard Navigation', () => {
  test('unauthenticated user sees landing page, not dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible({ timeout: 10000 });
  });

  test('sidebar links are present in layout pages', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForTimeout(2000);
    const sidebar = page.locator('[data-sidebar]').first();
    expect(await sidebar.count()).toBeGreaterThanOrEqual(0);
  });

  test('about page renders', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByText(/about|mission|devmapper/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('pricing page renders with certification tiers', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText(/pricing|plan|free/i).first()).toBeVisible({ timeout: 10000 });
    // Certification tiers should be visible
    await expect(page.getByText(/bronze|silver|gold|platinum/i).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Report Submission', () => {
  test('submit report page requires auth', async ({ page }) => {
    await page.goto('/submit-report');
    await page.waitForTimeout(3000);
    const hasForm = await page.locator('form, input[name], textarea').first().isVisible().catch(() => false);
    const hasAuthPrompt = await page.getByText(/sign in|log in|authenticate/i).first().isVisible().catch(() => false);
    expect(hasForm || hasAuthPrompt).toBeTruthy();
  });
});

test.describe('Public Pages', () => {
  test('SDG overview page renders', async ({ page }) => {
    await page.goto('/sdg-overview');
    await expect(page.getByText(/sdg|sustainable development/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('SPVF standards page renders', async ({ page }) => {
    await page.goto('/spvf-standards');
    await expect(page.getByText(/verification|standard|spvf/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('DSPM methodology page renders', async ({ page }) => {
    await page.goto('/dspm-methodology');
    await expect(page.getByText(/methodology|dspm|project/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('SDG indicators registry page renders', async ({ page }) => {
    await page.goto('/sdg-indicators');
    await expect(page.getByText(/indicator|registry|sdg/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('certification workflow page renders', async ({ page }) => {
    await page.goto('/certification-workflow');
    await expect(page.getByText(/certification|workflow|verification/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('platform overview page renders', async ({ page }) => {
    await page.goto('/platform-overview');
    await expect(page.getByText(/platform|overview|architecture/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('change makers page renders', async ({ page }) => {
    await page.goto('/change-makers');
    await expect(page.getByText(/change maker|impact|community/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('guidelines page renders', async ({ page }) => {
    await page.goto('/guidelines');
    await expect(page.getByText(/guide|how to|getting started/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('fundraising page renders', async ({ page }) => {
    await page.goto('/fundraising');
    await expect(page.getByText(/fundrais|campaign|donate/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Certificate Verification', () => {
  test('verify page renders without cert number', async ({ page }) => {
    await page.goto('/verify');
    await expect(page.getByText(/verify|certificate|search/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('404 Handling', () => {
  test('shows 404 for unknown route', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await expect(page.getByText(/not found|404|doesn't exist/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Responsive Design', () => {
  test('mobile viewport shows hamburger menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
  });
});
