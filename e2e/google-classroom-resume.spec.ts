import { expect, test } from "@playwright/test";

test.describe("Google Classroom resume popover", () => {
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
