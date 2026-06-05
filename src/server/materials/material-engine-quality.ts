import type {
  MaterialEngineRequest,
  MaterialEngineResponse,
} from "./material-engine-types";

const COUNT_TOLERANCE = 1;

function countIssues(
  label: string,
  expected: number,
  actual: number,
): string | null {
  if (actual === 0) {
    return `${label}: nenhum item foi gerado (esperado ${expected}).`;
  }
  if (actual < expected - COUNT_TOLERANCE || actual > expected + COUNT_TOLERANCE) {
    return `${label}: esperado ${expected}, recebido ${actual}.`;
  }
  return null;
}

export function getEngineOutputIssues(
  request: MaterialEngineRequest,
  output: MaterialEngineResponse,
): string[] {
  const issues: string[] = [];
  const q = request.quantidade;
  const tipo = request.tipoMaterial;

  if (tipo === "slides") {
    const issue = countIssues("slides", q, output.slides?.length ?? 0);
    if (issue) issues.push(issue);

    const slides = output.slides ?? [];
    const contentSlides = slides.filter(
      (s) => s.layout !== "capa" && s.layout !== "fechamento",
    );
    const withoutPrompt = contentSlides.filter((s) => !s.imagePrompt?.trim()).length;
    if (contentSlides.length > 0 && withoutPrompt > contentSlides.length * 0.4) {
      issues.push(
        "Slides: preencha 'imagePrompt' em todos os slides de conteúdo para imagens reais.",
      );
    }
    const withoutSequence = contentSlides.filter((s) => !s.sequenceStep).length;
    if (contentSlides.length > 2 && withoutSequence > contentSlides.length * 0.5) {
      issues.push(
        "Slides: defina 'sequenceStep' e 'sequenceLabel' em ordem pedagógica crescente.",
      );
    }
    if (slides[0]?.layout && slides[0].layout !== "capa") {
      issues.push("Slides: o primeiro slide deve ter layout 'capa'.");
    }
  }

  if (tipo === "flashcards") {
    const issue = countIssues("flashcards", q, output.flashcards?.length ?? 0);
    if (issue) issues.push(issue);
  }

  if (tipo === "prova" || tipo === "lista") {
    const n = output.exam?.questions?.length ?? 0;
    const issue = countIssues(tipo === "lista" ? "exercícios" : "questões", q, n);
    if (issue) issues.push(issue);
    if (request.incluirGabarito && n > 0) {
      const withAnswer =
        output.exam?.questions?.filter((item) => item.answer?.trim()).length ?? 0;
      if (withAnswer < Math.min(n, q) - COUNT_TOLERANCE) {
        issues.push(
          "Gabarito: preencha o campo 'answer' em cada questão e no array 'answerKey'.",
        );
      }
    }
  }

  if (tipo === "mapa-mental") {
    const n = output.mindMap?.branches?.length ?? 0;
    const issue = countIssues("ramos do mapa mental", q, n);
    if (issue) issues.push(issue);
    if (!output.mindMap?.central?.trim()) {
      issues.push("Mapa mental: informe o conceito central em mindMap.central.");
    }
  }

  if (tipo === "plano-aula") {
    const steps = output.lessonPlan?.steps?.length ?? 0;
    if (steps < 3) {
      issues.push(
        `Plano de aula: inclua pelo menos 3 etapas em lessonPlan.steps (recebido ${steps}).`,
      );
    }
  }

  if (tipo === "sequencia" || tipo === "projeto" || tipo === "apostila") {
    const sections = output.sections?.length ?? 0;
    const issue = countIssues("seções", q, sections);
    if (issue) issues.push(issue);
  }

  if (tipo === "atividade") {
    const activities = output.activities?.length ?? 0;
    const issue = countIssues("atividades", q, activities);
    if (issue) issues.push(issue);
  }

  if (tipo === "redacao") {
    const motivadores =
      output.sections?.filter((s) => s.title?.toLowerCase().includes("motivador"))
        .length ?? output.sections?.length ?? 0;
    if (motivadores < q - COUNT_TOLERANCE) {
      issues.push(
        `Redação: inclua pelo menos ${q} textos motivadores em sections (recebido ${motivadores}).`,
      );
    }
    if (!output.teacherNotes?.length) {
      issues.push(
        "Redação: inclua critérios de avaliação em teacherNotes.",
      );
    }
  }

  if (tipo === "jogo") {
    if (!output.game?.rules?.length) {
      issues.push("Jogo: preencha game.rules com passo a passo de aplicação.");
    }
    if (!output.game?.components?.length) {
      issues.push("Jogo: preencha game.components com materiais necessários.");
    }
  }

  if (tipo === "resumo") {
    if ((output.sections?.length ?? 0) < 2) {
      issues.push("Resumo: organize pelo menos 2 seções temáticas com bullets.");
    }
  }

  return issues;
}

export function buildQualityRetryPrompt(
  request: MaterialEngineRequest,
  issues: string[],
): string {
  return [
    "A entrega anterior não atendeu o contrato pedagógico. Corrija e regenere o JSON completo.",
    "",
    "Problemas detectados:",
    ...issues.map((item) => `- ${item}`),
    "",
    `Tipo: ${request.tipoMaterial}`,
    `Quantidade obrigatória: ${request.quantidade}`,
    `Incluir gabarito: ${request.incluirGabarito ? "sim" : "não"}`,
  ].join("\n");
}
