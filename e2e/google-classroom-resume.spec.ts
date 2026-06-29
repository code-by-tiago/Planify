import { expect, test } from "@playwright/test";

test.describe("Google Classroom resume popover", () => {
  test("asks for Classroom authorization when connected token is missing scopes", async ({ page }) => {
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
          classroomScopeGranted: false,
          missingClassroomScopes: [
            "https://www.googleapis.com/auth/classroom.courseworkmaterials",
          ],
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

    const classroomButton = page.getByRole("button", { name: /Google Classroom/i });
    await expect(classroomButton).toBeVisible();
    await classroomButton.click();

    await expect(
      page.getByText("precisa autorizar o Classroom para listar turmas", {
        exact: false,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Autorizar Google Classroom/i }),
    ).toBeVisible();
    expect(coursesRequested).toBe(0);
  });

  test("shows teacher courses when Classroom token is ready", async ({ page }) => {
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
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          courses: [
            { id: "turma-a", name: "Turma A", section: "Manha" },
            { id: "turma-b", name: "Turma B", section: "Tarde" },
          ],
        }),
      });
    });

    await page.goto("/test/google-classroom-resume");

    const classroomButton = page.getByRole("button", { name: /Google Classroom/i });
    await expect(classroomButton).toBeVisible();
    await classroomButton.click();

    await expect(page.getByLabel("Turma")).toBeVisible();
    await expect(page.getByText("Conectado como", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Turma")).toContainText("Turma A");
  });

  test("opens the classroom popover after OAuth return intent", async ({ page }) => {
    await page.goto("/test/google-classroom-resume");

    const classroomButton = page.getByRole("button", { name: /Google Classroom/i });
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

  test("opens the classroom popover after OAuth return with google query params in returnTo", async ({ page }) => {
    await page.goto("/test/google-classroom-resume?google=connected");

    const classroomButton = page.getByRole("button", { name: /Google Classroom/i });
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
