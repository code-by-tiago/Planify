import { expect, test } from "@playwright/test";

test.describe("Planify smoke", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Plataforma educacional|Planify/i);
    await expect(page.getByRole("link", { name: /entrar/i }).first()).toBeVisible();
  });

  test("login page renders form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /bem-vindo de volta/i })).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.getByRole("button", { name: /entrar como/i }).first()).toBeVisible();
  });

  test("protected route redirects unauthenticated users", async ({ page }) => {
    const response = await page.goto("/dashboard");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/login/);
  });
});
