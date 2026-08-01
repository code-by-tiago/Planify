import { expect, test } from "@playwright/test";

test.describe("Google Classroom premium modal", () => {
  test("starts Classroom OAuth when connected token is missing Classroom scopes", async ({ page }) => {
    let coursesRequested = 0;
    let authRequested = 0;

    await page.route("**/api/google/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          configured: true,
          authenticated: true,
          connected: true,
          googleEmail: "professor@educar.rs.gov.br",
          planifyEmail: "professor@gmail.com",
          formsScopeGranted: true,
          classroomScopeGranted: false,
          missingClassroomScopes: [
            "https://www.googleapis.com/auth/classroom.courseworkmaterials",
          ],
        }),
      });
    });

    await page.route("**/api/google/classroom/auth", async (route) => {
      authRequested += 1;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: { message: "OAuth indisponivel no teste" },
        }),
      });
    });

    await page.route("**/api/google/classroom/courses", async (route) => {
      coursesRequested += 1;
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false }),
      });
    });

    await page.goto("/test/google-classroom-resume");

    const classroomButton = page.getByRole("button", { name: /Enviar ao Classroom/i });
    await expect(classroomButton).toBeVisible();
    await classroomButton.click();

    await expect(
      page.getByRole("dialog", { name: /Enviar para Google Classroom/i }),
    ).toBeVisible();
    await expect.poll(() => authRequested).toBeGreaterThan(0);
    expect(coursesRequested).toBe(0);
  });

  test("shows multi-class publish modal when Google token is ready", async ({ page }) => {
    let coursesRequested = 0;

    await page.route("**/api/google/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          configured: true,
          authenticated: true,
          connected: true,
          googleEmail: "professor@educar.rs.gov.br",
          planifyEmail: "professor@gmail.com",
          formsScopeGranted: true,
          classroomScopeGranted: true,
          missingClassroomScopes: [],
        }),
      });
    });

    await page.route("**/api/google/classroom/courses", async (route) => {
      coursesRequested += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          courses: [
            { id: "c-6a", name: "6º Ano A", courseState: "ACTIVE" },
            { id: "c-6b", name: "6º Ano B", courseState: "ACTIVE" },
          ],
        }),
      });
    });

    await page.goto("/test/google-classroom-resume");

    const classroomButton = page.getByRole("button", { name: /Enviar ao Classroom/i });
    await expect(classroomButton).toBeVisible();
    await classroomButton.click();

    await expect(
      page.getByRole("dialog", { name: /Enviar para Google Classroom/i }),
    ).toBeVisible();
    await expect(page.getByLabel("6º Ano A")).toBeVisible();
    await expect(page.getByLabel("6º Ano B")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Material" })).toBeChecked();
    await page.getByRole("radio", { name: "Atividade" }).check();
    await expect(page.getByLabel("Data de entrega")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Publicar$/ })).toBeVisible();
    expect(coursesRequested).toBeGreaterThan(0);
  });

  test("opens the classroom modal after OAuth return intent", async ({ page }) => {
    await page.goto("/test/google-classroom-resume");

    const classroomButton = page.getByRole("button", { name: /Enviar ao Classroom/i });
    await expect(classroomButton).toBeVisible();

    await page.evaluate(() => {
      const buttonKey =
        "planify:classroom-open-after-oauth-button:Teste:/test/google-classroom-resume:teste";
      sessionStorage.removeItem("planify:classroom-open-after-oauth");
      sessionStorage.removeItem("planify:classroom-open-after-oauth-handled");
      sessionStorage.setItem("planify:classroom-open-after-oauth", "1");
      sessionStorage.setItem("planify:classroom-open-after-oauth-button", buttonKey);
    });

    await page.reload();

    await expect(classroomButton).toHaveAttribute("aria-expanded", "true", {
      timeout: 10000,
    });
  });

  test("opens the classroom modal after OAuth return with google query params in returnTo", async ({ page }) => {
    await page.goto("/test/google-classroom-resume?google=connected");

    const classroomButton = page.getByRole("button", { name: /Enviar ao Classroom/i });
    await expect(classroomButton).toBeVisible();

    await page.evaluate(() => {
      const buttonKey =
        "planify:classroom-open-after-oauth-button:Teste:/test/google-classroom-resume:teste";
      sessionStorage.removeItem("planify:classroom-open-after-oauth");
      sessionStorage.removeItem("planify:classroom-open-after-oauth-handled");
      sessionStorage.setItem("planify:classroom-open-after-oauth", "1");
      sessionStorage.setItem("planify:classroom-open-after-oauth-button", buttonKey);
    });

    await page.reload();

    await expect(classroomButton).toHaveAttribute("aria-expanded", "true", {
      timeout: 10000,
    });
  });
});
