import { Page } from '@playwright/test';

export const TEST_PASSWORD = 'DevMapperSweep2026!';

export const TEST_ACCOUNTS = {
  citizen: 'citizen@test.devmapper.africa',
  ngo: 'ngo@test.devmapper.africa',
  government: 'government@test.devmapper.africa',
  corporate: 'corporate@test.devmapper.africa',
  changemaker: 'changemaker@test.devmapper.africa',
  admin: 'admin@test.devmapper.africa',
  funder: 'funder@test.devmapper.africa',
} as const;

export type TestRole = keyof typeof TEST_ACCOUNTS;

export async function loginAs(page: Page, role: TestRole, baseURL: string) {
  // Auth.tsx: Tabs defaultValue="signin" is active by default, fields are
  // #signin-email / #signin-password inside that tab's content.
  await page.goto(`${baseURL}/auth`);
  await page.locator('#signin-email').fill(TEST_ACCOUNTS[role]);
  await page.locator('#signin-password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 15000 });
}
