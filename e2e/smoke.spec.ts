import { expect, test } from "@playwright/test";

test.describe("Planify smoke", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Plataforma educacional|Planify/i);
    await expect(page.getByRole("link", { name: /entrar/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^contato$/i }).first()).toBeVisible();
  });

  test("login page renders form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /bem-vindo de volta/i })).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.getByRole("button", { name: /entrar como/i }).first()).toBeVisible();
  });

  test("paid customer activation page shows password creation form", async ({ page }) => {
    await page.goto("/planos/ativar");
    await expect(
      page.getByRole("heading", { name: "Ative sua conta com o e-mail do pagamento." }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Crie sua senha de acesso" })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveCount(2);
    await expect(page.getByText("Código da sessão")).toHaveCount(0);
    await expect(page.getByText("session_id=")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Criar senha e entrar" })).toBeVisible();
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
      "/banco-questoes",
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
      "/termos",
      "/privacidade",
    ];

    for (const path of paths) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should not 500`).toBeLessThan(500);
    }
  });

  test("contact page sends support message by email flow", async ({ page }) => {
    let contactRequested = false;
    await page.route("**/api/contact", async (route) => {
      contactRequested = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message:
            "Sua mensagem foi enviada à equipe do Planify. Em breve entraremos em contato.",
        }),
      });
    });

    await page.goto("/contato");
    await expect(page.getByRole("heading", { name: /atendimento para professores/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /envie sua mensagem/i })).toBeVisible();
    await page.getByLabel("Nome").fill("Professora Teste");
    await page.getByLabel("E-mail").fill("professora@example.com");
    await page.getByLabel("Assunto").fill("Duvida sobre suporte");
    await page
      .getByLabel("Mensagem")
      .fill("Mensagem de teste com detalhes suficientes para validar o envio.");
    await expect(page.getByRole("button", { name: /enviar mensagem/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /enviar pelo whatsapp/i })).toHaveCount(0);
    await page.getByRole("button", { name: /enviar mensagem/i }).click();
    await expect(
      page.getByText(/sua mensagem foi enviada (?:a|à) equipe do planify/i),
    ).toBeVisible();
    expect(contactRequested).toBe(true);
  });

  test("plans page presents the complete Professor offer", async ({ page }) => {
    await page.goto("/planos");
    await expect(
      page.getByRole("heading", { name: "Menos tempo montando. Mais tempo ensinando." }),
    ).toBeVisible();
    await expect(page.getByText("Planify Professor", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Assinar agora" })).toBeVisible();
  });

  test("auth-only routes redirect unauthenticated users", async ({ page }) => {
    for (const path of ["/progresso-bncc", "/bncc", "/gestor"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/login/);
    }
  });

  test("legacy tool links forward unauthenticated users to login", async ({ page }) => {
    for (const path of ["/aula-completa", "/correcao"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/login/);
    }
  });
});
