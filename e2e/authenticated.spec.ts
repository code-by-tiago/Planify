import { expect, test } from "@playwright/test";
import {
  ensurePremiumDashboard,
  hasE2eCredentials,
  loginAsTestUser,
} from "./fixtures/auth";

const skipUnlessCreds = () => {
  test.skip(!hasE2eCredentials(), "PLANIFY_E2E_EMAIL/PASSWORD not configured");
};

test.describe("authenticated smoke", () => {
  test("login reaches dashboard or planos", async ({ page }) => {
    skipUnlessCreds();
    await loginAsTestUser(page);
    await expect(page).not.toHaveURL(/\/login$/);
  });

  test("dashboard hub loads after login", async ({ page }) => {
    skipUnlessCreds();
    await loginAsTestUser(page);
    const hasDashboard = await ensurePremiumDashboard(page);
    test.skip(!hasDashboard, "Test account lacks premium access");

    await expect(page.getByText(/geradores|painel|Planify/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});

test.describe("authenticated mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("biblioteca list section renders", async ({ page }) => {
    skipUnlessCreds();
    await loginAsTestUser(page);
    const hasDashboard = await ensurePremiumDashboard(page);
    test.skip(!hasDashboard, "Test account lacks premium access");

    await page.goto("/dashboard?secao=biblioteca");
    await expect(page.getByText(/Biblioteca/i).first()).toBeVisible({
      timeout: 25_000,
    });
  });

  test("materiais studio shell opens for prova", async ({ page }) => {
    skipUnlessCreds();
    await loginAsTestUser(page);
    const hasDashboard = await ensurePremiumDashboard(page);
    test.skip(!hasDashboard, "Test account lacks premium access");

    await page.goto("/dashboard?tipo=prova");
    await expect(page.getByText(/Configurar geração|Prova/i).first()).toBeVisible({
      timeout: 25_000,
    });
    await expect(
      page.locator(".planify-tool-studio, .planify-materiais-studio").first(),
    ).toBeVisible();
  });

  test("export dock stays in viewport when material is ready", async ({ page }) => {
    skipUnlessCreds();
    await loginAsTestUser(page);
    const hasDashboard = await ensurePremiumDashboard(page);
    test.skip(!hasDashboard, "Test account lacks premium access");

    await page.goto("/dashboard?tipo=prova");
    await page.waitForLoadState("networkidle");

    const exportDock = page.locator('[aria-label="Exportar material"]');
    if ((await exportDock.count()) === 0) {
      test.skip(true, "No generated material in session — export dock not shown");
    }

    await expect(exportDock.first()).toBeInViewport();
  });
});
