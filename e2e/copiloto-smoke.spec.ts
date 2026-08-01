import { expect, test } from "@playwright/test";

test.describe("Copiloto smoke", () => {
  test("copiloto API enforces auth contract", async ({ request }) => {
    const transcribe = await request.post("/api/copiloto/transcrever", {
      multipart: {
        audio: {
          name: "empty.webm",
          mimeType: "audio/webm",
          buffer: Buffer.from(""),
        },
      },
    });
    expect(transcribe.status()).toBe(401);
    const transcribeBody = await transcribe.json();
    expect(transcribeBody.success).toBe(false);
    expect(transcribeBody.error?.message).toMatch(/autentica/i);

    const interpret = await request.post("/api/copiloto/interpretar", {
      data: { transcript: "Preciso de uma lista de história para o 6º ano" },
    });
    expect(interpret.status()).toBe(401);
    const interpretBody = await interpret.json();
    expect(interpretBody.success).toBe(false);
    expect(interpretBody.error?.message).toMatch(/autentica/i);
  });

  test("dashboard copiloto section redirects unauthenticated users", async ({ page }) => {
    const response = await page.goto("/dashboard?tipo=copiloto");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/login|planos/);
  });
});
