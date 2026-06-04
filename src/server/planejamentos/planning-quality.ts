import type { PlanningAiPayload, PlanningMatrixItem } from "./planning-ai-service";
import { splitPlanningConteudos } from "./planning-validation";

function getTipo(payload: PlanningAiPayload): "anual" | "trimestral" {
  const raw = String(payload.tipoPlanejamento || "anual")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  return raw.includes("tri") ? "trimestral" : "anual";
}

export function getPlanningOutputIssues(
  payload: PlanningAiPayload,
  items: PlanningMatrixItem[],
): string[] {
  const issues: string[] = [];
  const inputContents = splitPlanningConteudos(payload.conteudos);
  const tipo = getTipo(payload);

  if (items.length === 0) {
    issues.push("A matriz não contém linhas de conteúdo.");
    return issues;
  }

  if (tipo === "anual" && items.length < Math.min(12, inputContents.length * 4)) {
    issues.push(
      `Planejamento anual: esperado pelo menos ${Math.min(12, Math.max(inputContents.length, 3))} linhas na matriz.`,
    );
  }

  const emptyFields = items.filter(
    (item) =>
      !item.objetivos?.trim() ||
      !item.metodologia?.trim() ||
      !item.avaliacao?.trim(),
  ).length;

  if (emptyFields > Math.floor(items.length / 2)) {
    issues.push(
      "Preencha objetivos, metodologia e avaliação em cada linha da matriz.",
    );
  }

  const withoutSkills = items.filter((item) => item.habilidades.length === 0).length;
  if (withoutSkills > 0) {
    issues.push(
      `${withoutSkills} linha(s) sem habilidade BNCC vinculada às selecionadas.`,
    );
  }

  const allowedCodes = new Set(
    (payload.habilidadesSelecionadas || []).map((skill) =>
      String(skill.codigo || "").trim().toUpperCase(),
    ),
  );

  for (const item of items) {
    for (const skill of item.habilidades) {
      const code = String(skill.codigo || "").trim().toUpperCase();
      if (code === "BNCC" || (allowedCodes.size > 0 && !allowedCodes.has(code))) {
        issues.push(
          `Habilidade inválida ou não selecionada na linha "${item.conteudo}": ${skill.codigo}.`,
        );
        break;
      }
    }
  }

  return Array.from(new Set(issues));
}

export function buildPlanningQualityRetryNote(issues: string[]): string {
  return [
    "CORREÇÃO OBRIGATÓRIA — a matriz anterior não cumpriu o contrato:",
    ...issues.map((item) => `- ${item}`),
    "Use somente habilidades BNCC que o professor selecionou.",
    "Não invente códigos genéricos como BNCC.",
  ].join("\n");
}
