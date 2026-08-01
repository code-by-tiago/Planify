import { expect, test } from "@playwright/test";

test.describe("Google OAuth return flow", () => {
  test("redirects unauthenticated completed OAuth returns to login", async ({ page }) => {
    await page.goto("/google/retorno?returnTo=/editor&google=connected");
    await page.waitForURL(/\/login/);

    await expect(page).toHaveURL(/\/login\?redirect=%2Feditor.*sessao_expirada=1/);
  });

  test("redirects unauthenticated OAuth errors to login", async ({ page }) => {
    await page.goto("/google/retorno?returnTo=/editor&google_error=Autorizacao+negada");
    await page.waitForURL(/\/login/);

    await expect(page).toHaveURL(/\/login\?redirect=%2Feditor.*sessao_expirada=1/);
  });

  test("sanitizes unsafe returnTo values for connected OAuth before redirecting", async ({ page }) => {
    await page.goto(
      "/google/retorno?returnTo=https%3A%2F%2Fevil.com%2Fdashboard&google=connected",
    );
    await page.waitForURL(/\/login/);

    await expect(page).toHaveURL(
      /\/login\?redirect=%2Fdashboard%3Fsecao%3Deditor(?:%26google%3Dconnected)?&sessao_expirada=1/,
    );
  });

  test("sanitizes unsafe returnTo values for OAuth errors before redirecting", async ({ page }) => {
    await page.goto(
      "/google/retorno?returnTo=https%3A%2F%2Fevil.com%2F/dashboard&google_error=Autorizacao+negada",
    );
    await page.waitForURL(/\/login/);

    await expect(page).toHaveURL(
      /\/login\?redirect=%2Fdashboard%3Fsecao%3Deditor(?:%26google_error%3DAutorizacao%2Bnegada)?&sessao_expirada=1/,
    );
  });
});
