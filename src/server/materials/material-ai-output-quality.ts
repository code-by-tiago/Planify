import type { MaterialAIOutput } from "@/types/ai";
import type { MaterialEngineRequest } from "./material-engine-types";

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

export function getAIOutputIssues(
  request: MaterialEngineRequest,
  output: MaterialAIOutput,
): string[] {
  const issues: string[] = [];
  const q = request.quantidade;
  const tipo = request.tipoMaterial;

  if (tipo === "prova" || tipo === "lista" || tipo === "atividade") {
    const issue = countIssues(
      tipo === "lista" ? "exercícios" : tipo === "prova" ? "questões" : "itens",
      q,
      output.questoes.length,
    );
    if (issue) issues.push(issue);

    if (request.incluirGabarito) {
      const withAnswer = output.questoes.filter(
        (item) => item.respostaEsperada?.trim(),
      ).length;
      if (withAnswer < Math.min(output.questoes.length, q) - COUNT_TOLERANCE) {
        issues.push(
          "Preencha respostaEsperada e criterioCorrecao em cada questão e consolide o gabarito.",
        );
      }
    }
  }

  if (tipo === "apostila") {
    if (output.secoes.length < Math.min(q, 4)) {
      issues.push(
        `Apostila: organize pelo menos ${Math.min(q, 4)} seções/capítulos (recebido ${output.secoes.length}).`,
      );
    }
  }

  if (tipo === "sequencia" || tipo === "projeto") {
    const issue = countIssues("seções", q, output.secoes.length);
    if (issue) issues.push(issue);
  }

  if (tipo === "plano-aula") {
    if (output.secoes.length < 3) {
      issues.push(
        `Plano de aula: inclua pelo menos 3 seções com etapas (recebido ${output.secoes.length}).`,
      );
    }
    if (!output.criteriosAvaliacao.length) {
      issues.push("Plano de aula: inclua critérios de avaliação em criteriosAvaliacao.");
    }
  }

  if (tipo === "redacao") {
    const motivadores = output.secoes.filter((s) =>
      /motivador/i.test(s.titulo),
    ).length;
    if (motivadores < q - COUNT_TOLERANCE) {
      issues.push(
        `Redação: inclua ${q} textos motivadores em seções próprias (recebido ${motivadores}).`,
      );
    }
    if (!output.criteriosAvaliacao.length) {
      issues.push("Redação: inclua critérios de avaliação em criteriosAvaliacao.");
    }
  }

  if (tipo === "resumo") {
    const issue = countIssues("blocos temáticos", q, output.secoes.length);
    if (issue) issues.push(issue);
  }

  if (tipo === "jogo") {
    const hasVisual =
      Boolean(output.printHtml?.trim()) ||
      Boolean(output.visualHtml?.trim()) ||
      output.secoes.some((s) => Boolean(s.visualHtml?.trim()));
    if (!hasVisual) {
      issues.push(
        "Jogo: inclua material visual imprimível (printHtml, visualHtml ou secoes.visualHtml).",
      );
    }
    if (!output.jogo?.regras?.length) {
      issues.push("Jogo: preencha o objeto jogo com regras e modoDeJogar.");
    }
  }

  return issues;
}

export function buildAIQualityRetryObservacoes(
  request: MaterialEngineRequest,
  issues: string[],
): string {
  return [
    "CORREÇÃO OBRIGATÓRIA — a entrega anterior não cumpriu o contrato:",
    ...issues.map((item) => `- ${item}`),
    `Tipo: ${request.tipoMaterial}`,
    `Quantidade: ${request.quantidade}`,
    `Gabarito: ${request.incluirGabarito ? "sim" : "não"}`,
  ].join("\n");
}
