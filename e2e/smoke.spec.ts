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

  test("premium routes redirect or challenge unauthenticated users", async ({ page }) => {
    const premiumPaths = [
      "/planejamentos",
      "/biblioteca",
      "/marketplace",
      "/comunidade",
      "/editor",
      "/historico",
    ];

    for (const path of premiumPaths) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should not 500`).toBeLessThan(500);
      await expect(page).toHaveURL(/login|planos/);
    }
  });

  test("public SEO and tool routes respond without server error", async ({ page }) => {
    const paths = [
      "/planos",
      "/robots.txt",
      "/sitemap.xml",
      "/materiais",
      "/planejamentos",
      "/inclusao",
      "/aula-completa",
      "/correcao",
      "/banco-questoes",
      "/termos",
      "/privacidade",
    ];

    for (const path of paths) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should not 500`).toBeLessThan(500);
    }
  });

  test("auth-only routes redirect unauthenticated users", async ({ page }) => {
    for (const path of ["/progresso-bncc", "/bncc", "/gestor"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/login/);
    }
  });
});
