import {
  collectQuestionSemanticIssues,
  collectSectionSemanticIssues,
  isGenericEducationalText,
} from "@/lib/materiais/material-semantic-quality";
import type { MaterialAIOutput } from "@/types/ai";
import type { MaterialEngineRequest } from "./material-engine-types";

const COUNT_TOLERANCE = 1;
const MAX_SEMANTIC_ISSUES_PER_ITEM = 2;

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

function appendQuestionSemantics(
  issues: string[],
  request: MaterialEngineRequest,
  output: MaterialAIOutput,
): void {
  const tema = request.tema;
  let flagged = 0;

  for (const question of output.questoes) {
    const semantic = collectQuestionSemanticIssues({
      statement: question.enunciado,
      answer: question.respostaEsperada,
      options: question.alternativas,
      tema,
    });

    for (const item of semantic.slice(0, MAX_SEMANTIC_ISSUES_PER_ITEM)) {
      issues.push(`Questão ${question.numero}: ${item}`);
      flagged += 1;
      if (flagged >= 6) return;
    }
  }
}

export function getAIOutputIssues(
  request: MaterialEngineRequest,
  output: MaterialAIOutput,
): string[] {
  const issues: string[] = [];
  const q = request.quantidade;
  const tipo = request.tipoMaterial;

  if (["prova", "lista", "atividade", "revisao"].includes(tipo)) {
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

    appendQuestionSemantics(issues, request, output);
  }

  if (tipo === "apostila") {
    if (output.secoes.length < Math.min(q, 4)) {
      issues.push(
        `Apostila: organize pelo menos ${Math.min(q, 4)} seções/capítulos (recebido ${output.secoes.length}).`,
      );
    }

    for (const section of output.secoes.slice(0, 6)) {
      for (const item of collectSectionSemanticIssues({
        title: section.titulo,
        content: section.conteudo || section.itens.join(" "),
        tema: request.tema,
      }).slice(0, 1)) {
        issues.push(`Apostila — ${section.titulo}: ${item}`);
      }
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

  if (
    ["prova", "lista", "atividade", "apostila"].includes(tipo) &&
    (isGenericEducationalText(output.introducao) ||
      isGenericEducationalText(output.resumo))
  ) {
    issues.push(
      "Evite introdução/resumo genérico; comece com produto pronto para sala.",
    );
  }

  return issues;
}

export function buildAIQualityRetryObservacoes(
  request: MaterialEngineRequest,
  issues: string[],
): string {
  return [
    "CORREÇÃO OBRIGATÓRIA — a entrega anterior não cumpriu o contrato pedagógico:",
    ...issues.map((item) => `- ${item}`),
    `Tema obrigatório em cada questão/seção: "${request.tema}".`,
    `Tipo: ${request.tipoMaterial}`,
    `Quantidade: ${request.quantidade}`,
    `Gabarito: ${request.incluirGabarito ? "sim" : "não"}`,
    "Reescreva com enunciados específicos, exemplos reais e gabarito comentado.",
  ].join("\n");
}
