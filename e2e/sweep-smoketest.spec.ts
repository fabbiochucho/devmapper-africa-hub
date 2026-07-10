import { test, expect } from '@playwright/test';
import { loginAs } from './sweep-helpers';

test('smoke: citizen login lands on an authenticated page', async ({ page, baseURL }) => {
  await loginAs(page, 'citizen', baseURL!);
  await expect(page).not.toHaveURL(/\/auth/);
});

test('smoke: admin login lands on an authenticated page', async ({ page, baseURL }) => {
  await loginAs(page, 'admin', baseURL!);
  await expect(page).not.toHaveURL(/\/auth/);
});
