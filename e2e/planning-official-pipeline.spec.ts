import { expect, test } from "@playwright/test";

const OFFICIAL_HTML =
  '<article class="planify-doc planify-planning-official" data-planify-html-source="official-docx">' +
  '<table><tr><td>Unidade Temática</td><td>Conteúdo fixture</td></tr></table>' +
  "</article>";

const FIXTURE_PAYLOAD = {
  tipoPlanejamento: "anual",
  escola: "Escola Teste",
  professor: "Prof. Teste",
  etapa: "Ensino Fundamental",
  anoSerie: "5º ano",
  areaConhecimento: "Ciências Humanas",
  componenteCurricular: "História",
  cargaHoraria: "60 períodos",
  matrizPlanejamento: {
    tipoPlanejamento: "anual",
    titulo: "Planejamento anual",
    resumo: "Fixture",
    conteudos: [
      {
        conteudo: "Povos originários",
        trimestre: 1,
        numeroAula: 1,
        periodos: 2,
        aulaInicio: 1,
        aulaFim: 2,
        habilidades: [{ codigo: "EF05HI01", descricao: "Habilidade fixture." }],
        objetivos: "Objetivo",
        metodologia: "Metodologia",
        recursos: "Recursos",
        materiais: "Materiais",
        etapas: "Etapas",
        avaliacao: "Avaliação",
        evidencias: "Evidências",
      },
    ],
  },
};

test.describe("Planning official pipeline API", () => {
  test("html-oficial requires premium auth", async ({ request }) => {
    const response = await request.post("/api/planejamentos/html-oficial", {
      data: FIXTURE_PAYLOAD,
    });

    expect(response.status()).toBe(401);

    const body = (await response.json()) as {
      success?: boolean;
      error?: { message?: string };
    };

    expect(body.success).toBe(false);
  });

  test("gerar-ia requires premium auth", async ({ request }) => {
    const response = await request.post("/api/planejamentos/gerar-ia", {
      data: {
        ...FIXTURE_PAYLOAD,
        conteudos: "Povos originários",
        habilidadesSelecionadas: [
          { codigo: "EF05HI01", descricao: "Habilidade fixture." },
        ],
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe("Planning official pipeline UI", () => {
  test("bundle anual + trimestres resolve official-docx for all tabs", async ({ page }) => {
    let htmlOficialRequests = 0;

    await page.route("**/api/planejamentos/html-oficial", async (route) => {
      htmlOficialRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          html: OFFICIAL_HTML,
          filename: "planejamento-teste.docx",
          templateSource: "official",
        }),
      });
    });

    await page.goto("/test/planning-official-pipeline");

    await expect.poll(() => htmlOficialRequests, { timeout: 15_000 }).toBe(4);

    const pipelineResult = await page.evaluate(() => {
      return (
        window as Window & {
          __PLANIFY_PIPELINE_RESULT?: {
            status: string;
            results: Array<{ id: string; marker: string }>;
          };
        }
      ).__PLANIFY_PIPELINE_RESULT;
    });

    expect(pipelineResult?.status).toBe("ok");
    expect(pipelineResult?.results.map((item) => item.id)).toEqual([
      "anual",
      "trim1",
      "trim2",
      "trim3",
    ]);

    for (const item of pipelineResult?.results ?? []) {
      expect(item.marker).toBe("official-docx");
    }
  });

  test("editor route challenges unauthenticated users", async ({ page }) => {
    const response = await page.goto("/editor?from=planejamentos&bundle=1");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveURL(/login|planos/);
  });
});
