import { expect, test } from "@playwright/test";

const viewports = [
  { label: "mobile", width: 390, height: 844 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "desktop", width: 1280, height: 800 },
] as const;

for (const viewport of viewports) {
  test.describe(`responsive ${viewport.label}`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
    });

    test("landing and login stay usable", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("link", { name: /entrar/i }).first()).toBeVisible();

      await page.goto("/login");
      await expect(
        page.getByRole("heading", { name: /bem-vindo de volta/i }),
      ).toBeVisible();
      await expect(
        page.locator('input[type="email"], input[name="email"]').first(),
      ).toBeVisible();
    });

    test("public tool routes respond without server error", async ({ page }) => {
      const paths = [
        "/planos",
        "/materiais",
        "/planejamentos",
        "/inclusao",
        "/aula-completa",
        "/correcao",
        "/contato",
      ];

      for (const path of paths) {
        const response = await page.goto(path);
        expect(response?.status(), `${path} should not 500`).toBeLessThan(500);
      }
    });

    test("protected routes redirect unauthenticated users", async ({ page }) => {
      for (const path of ["/dashboard", "/biblioteca", "/historico", "/editor"]) {
        await page.goto(path);
        await expect(page).toHaveURL(/login|planos/);
      }
    });
  });
}
