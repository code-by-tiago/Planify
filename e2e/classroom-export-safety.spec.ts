import { expect, test } from "@playwright/test";

test.describe("Classroom export API safety", () => {
  test("rejects unauthenticated classroom export", async ({ request }) => {
    const response = await request.post("/api/google/classroom/export", {
      data: {
        title: "Material de teste",
        html: "<p>Conteudo pedagogico</p>",
        courseId: "course-test-123",
        publishState: "DRAFT",
      },
    });

    expect(response.status()).toBe(401);

    const body = (await response.json()) as {
      success?: boolean;
      error?: { message?: string };
    };

    expect(body.success).toBe(false);
    expect(body.error?.message || "").toMatch(/login|conecte/i);
  });

  test("rejects unauthenticated classroom courses list", async ({ request }) => {
    const response = await request.get("/api/google/classroom/courses");
    expect(response.status()).toBe(401);
  });
});

test.describe("Classroom export UI entry", () => {
  test("editor route challenges unauthenticated users", async ({ page }) => {
    const response = await page.goto("/editor");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/login|planos/);
  });
});
