import { expect, test } from "@playwright/test";

const mobileViewports = [
  { label: "iphone", width: 390, height: 844 },
  { label: "android", width: 360, height: 800 },
] as const;

for (const viewport of mobileViewports) {
  test.describe(`mobile tools ${viewport.label}`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: true,
      hasTouch: true,
    });

    test("public tool routes stay usable without horizontal overflow", async ({
      page,
    }) => {
      const paths = ["/materiais", "/inclusao", "/aula-completa", "/correcao"];

      for (const path of paths) {
        const response = await page.goto(path);
        expect(response?.status() ?? 0).toBeLessThan(500);

        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollWidth - doc.clientWidth;
        });
        expect(overflow).toBeLessThanOrEqual(8);
      }
    });

    test("landing CTA remains thumb-friendly", async ({ page }) => {
      await page.goto("/");
      const cta = page.getByRole("link", { name: /entrar|começar|gerar|testar/i }).first();
      await expect(cta).toBeVisible();
      const box = await cta.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(36);
    });

    test("offline page is reachable", async ({ page }) => {
      await page.goto("/offline");
      await expect(page.getByRole("heading", { name: /sem conexão/i })).toBeVisible();
      await expect(
        page.getByRole("link", { name: /tentar abrir o painel/i }),
      ).toBeVisible();
    });
  });
}
