import {
  isGenericEducationalText,
  themeReferencedInText,
} from "@/lib/materiais/material-semantic-quality";
import type { PlanningAiPayload, PlanningMatrixItem } from "./planning-ai-service";
import { splitPlanningConteudos } from "./planning-validation";

function normalizeSearch(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const GENERIC_METHODOLOGY =
  /aula dialogada,\s*pr[aá]tica orientada,\s*registro e socializa/i;

function getTipo(payload: PlanningAiPayload): "anual" | "trimestral" {
  const raw = String(payload.tipoPlanejamento || "anual")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  return raw.includes("tri") ? "trimestral" : "anual";
}

function inputContentCovered(
  inputContent: string,
  items: PlanningMatrixItem[],
): boolean {
  const needle = normalizeSearch(inputContent);
  if (!needle || needle.length < 3) return true;

  return items.some((item) => {
    const hay = normalizeSearch(item.conteudo);
    if (hay.includes(needle) || needle.includes(hay)) return true;

    const tokens = needle.split(" ").filter((word) => word.length >= 4);
    return tokens.some((token) => hay.includes(token));
  });
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

  const minRows =
    tipo === "anual"
      ? Math.min(12, Math.max(inputContents.length * 4, 3))
      : Math.max(inputContents.length, 1);

  if (tipo === "anual" && items.length < minRows) {
    issues.push(
      `Planejamento anual: esperado pelo menos ${minRows} linhas na matriz (recebido ${items.length}).`,
    );
  }

  if (tipo === "trimestral" && items.length < inputContents.length) {
    issues.push(
      `Planejamento trimestral: inclua pelo menos uma linha por conteúdo informado (${inputContents.length}).`,
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

  for (const inputContent of inputContents.slice(0, 12)) {
    if (!inputContentCovered(inputContent, items)) {
      issues.push(
        `O conteúdo informado "${inputContent}" não aparece de forma clara na matriz.`,
      );
    }
  }

  let semanticFlags = 0;
  for (const item of items) {
    if (semanticFlags >= 5) break;

    if (isGenericEducationalText(item.objetivos)) {
      issues.push(`Objetivos genéricos na linha "${item.conteudo}".`);
      semanticFlags += 1;
    }
    if (
      GENERIC_METHODOLOGY.test(item.metodologia) ||
      isGenericEducationalText(item.metodologia)
    ) {
      issues.push(
        `Metodologia genérica ou repetida na linha "${item.conteudo}" — detalhe estratégias específicas.`,
      );
      semanticFlags += 1;
    }
    if (
      inputContents.length > 0 &&
      !themeReferencedInText(
        `${item.conteudo} ${item.objetivos}`,
        inputContents[0] || item.conteudo,
      ) &&
      item.objetivos.length < 80
    ) {
      issues.push(
        `Objetivos pouco ligados ao conteúdo "${item.conteudo}".`,
      );
      semanticFlags += 1;
    }
  }

  const trimesters = new Set(items.map((item) => item.trimestre));
  if (tipo === "anual" && trimesters.size < 2 && items.length >= 6) {
    issues.push(
      "Planejamento anual: distribua conteúdos entre mais de um trimestre.",
    );
  }

  return Array.from(new Set(issues));
}

export function buildPlanningQualityRetryNote(issues: string[]): string {
  return [
    "CORREÇÃO OBRIGATÓRIA — a matriz anterior não cumpriu o contrato pedagógico:",
    ...issues.map((item) => `- ${item}`),
    "Use somente habilidades BNCC que o professor selecionou.",
    "Não invente códigos genéricos como BNCC.",
    "Evite metodologias copiadas iguais em todas as linhas.",
    "Cada linha deve refletir o conteúdo específico informado pelo professor.",
  ].join("\n");
}
