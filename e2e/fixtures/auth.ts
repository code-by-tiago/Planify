import { expect, type Page } from "@playwright/test";

export function hasE2eCredentials(): boolean {
  return Boolean(
    process.env.PLANIFY_E2E_EMAIL?.trim() &&
      process.env.PLANIFY_E2E_PASSWORD?.trim(),
  );
}

export async function loginAsTestUser(page: Page): Promise<void> {
  const email = process.env.PLANIFY_E2E_EMAIL!.trim();
  const password = process.env.PLANIFY_E2E_PASSWORD!.trim();

  await page.goto("/login");
  await page
    .locator('input[type="email"], input[name="email"]')
    .first()
    .fill(email);
  await page
    .locator('input[type="password"], input[name="password"]')
    .first()
    .fill(password);
  await page.getByRole("button", { name: /entrar como/i }).first().click();

  await page.waitForURL(
    (url) => !url.pathname.startsWith("/login"),
    { timeout: 45_000 },
  );

  const pathname = new URL(page.url()).pathname;
  expect(pathname).not.toBe("/login");
}

export async function ensurePremiumDashboard(page: Page): Promise<boolean> {
  const pathname = new URL(page.url()).pathname;
  if (pathname.startsWith("/planos")) {
    return false;
  }

  if (!pathname.startsWith("/dashboard")) {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  }

  return !page.url().includes("/login") && !page.url().includes("/planos");
}
