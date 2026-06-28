import {
  isGenericEducationalText,
  themeReferencedInText,
} from "@/lib/materiais/material-semantic-quality";
import { computeQualityScore } from "@/lib/materiais/material-quality-score";
import type { PlanningAiPayload, PlanningMatrixItem } from "./planning-ai-service";
import { OFFICIAL_MAX_PERIODS_PER_ROW } from "./planning-official-contract";
import {
  matrixPeriodsTotal,
  parsePlanningCargaHoraria,
} from "./planning-lesson-allocation";
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

function contentKey(value: unknown): string {
  return normalizeSearch(value)
    .replace(/\b(parte|aula|semana)\s*\d+\b/g, "")
    .replace(/\b[ivx]+\b$/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
    issues.push("A matriz nao contem linhas de conteudo.");
    return issues;
  }

  const expectedRows = Math.max(inputContents.length, 1);
  if (inputContents.length > 0 && items.length !== expectedRows) {
    issues.push(
      `A matriz deve ter exatamente uma aula por conteudo informado (${expectedRows}); recebeu ${items.length}.`,
    );
  }

  const cargaEsperada = parsePlanningCargaHoraria(
    payload.cargaHoraria,
    Math.max(expectedRows, 1),
  );
  const periodosTotal = matrixPeriodsTotal(items);
  if (periodosTotal !== cargaEsperada) {
    issues.push(
      `A soma de periodos (${periodosTotal}) deve ser igual a carga horaria (${cargaEsperada}).`,
    );
  }

  const seenContents = new Set<string>();
  const repeatedContents = new Set<string>();
  for (const item of items) {
    const key = contentKey(item.conteudo);
    if (!key) continue;
    if (seenContents.has(key)) repeatedContents.add(item.conteudo);
    seenContents.add(key);
  }
  if (repeatedContents.size > 0) {
    issues.push(
      `Conteudos repetidos na matriz: ${Array.from(repeatedContents).slice(0, 5).join("; ")}.`,
    );
  }

  const invalidPeriodos = items.filter((item) => {
    const periodos = Number(item.periodos);
    const rowMax = Math.max(
      OFFICIAL_MAX_PERIODS_PER_ROW,
      Math.ceil(cargaEsperada / Math.max(1, items.length)),
    );
    return !Number.isFinite(periodos) || periodos < 1 || periodos > rowMax;
  }).length;
  if (invalidPeriodos > 0) {
    issues.push(
      `${invalidPeriodos} linha(s) com periodos fora do intervalo permitido para a carga informada.`,
    );
  }

  const trimesterCounters = new Map<number, number>();
  const invalidNumeroAula = items.filter((item) => {
    const trimestre = Number(item.trimestre) || 1;
    const expected = (trimesterCounters.get(trimestre) || 0) + 1;
    trimesterCounters.set(trimestre, expected);
    return Number(item.numeroAula) !== expected;
  }).length;
  if (invalidNumeroAula > 0) {
    issues.push(
      `${invalidNumeroAula} linha(s) com numeroAula fora da sequencia por trimestre (1, 2, 3...).`,
    );
  }

  const invalidAulaRange = items.filter((item) => {
    const periodos = Number(item.periodos);
    const aulaInicio = Number(item.aulaInicio);
    const aulaFim = Number(item.aulaFim);
    return aulaFim - aulaInicio + 1 !== periodos;
  }).length;
  if (invalidAulaRange > 0) {
    issues.push(
      `${invalidAulaRange} linha(s) com aulaInicio/aulaFim inconsistentes com periodos.`,
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
      "Preencha objetivos, metodologia e avaliacao em cada linha da matriz.",
    );
  }

  const withoutSkills = items.filter((item) => item.habilidades.length === 0).length;
  if (withoutSkills > 0) {
    issues.push(
      `${withoutSkills} linha(s) sem habilidade BNCC vinculada as selecionadas.`,
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
          `Habilidade invalida ou nao selecionada na linha "${item.conteudo}": ${skill.codigo}.`,
        );
        break;
      }
    }
  }

  for (const inputContent of inputContents.slice(0, 12)) {
    if (!inputContentCovered(inputContent, items)) {
      issues.push(
        `O conteudo informado "${inputContent}" nao aparece de forma clara na matriz.`,
      );
    }
  }

  let semanticFlags = 0;
  for (const item of items) {
    if (semanticFlags >= 5) break;

    if (isGenericEducationalText(item.objetivos)) {
      issues.push(`Objetivos genericos na linha "${item.conteudo}".`);
      semanticFlags += 1;
    }
    if (
      GENERIC_METHODOLOGY.test(item.metodologia) ||
      isGenericEducationalText(item.metodologia)
    ) {
      issues.push(
        `Metodologia generica ou repetida na linha "${item.conteudo}" - detalhe estrategias especificas.`,
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
        `Objetivos pouco ligados ao conteudo "${item.conteudo}".`,
      );
      semanticFlags += 1;
    }
  }

  const trimesters = new Set(
    items
      .map((item) => Number(item.trimestre))
      .filter((value) => Number.isFinite(value) && value >= 1 && value <= 3),
  );
  if (tipo === "anual" && items.length >= 3 && !trimesters.has(3)) {
    issues.push(
      "Planejamento anual: distribua conteudos tambem no 3o trimestre.",
    );
  } else if (tipo === "anual" && trimesters.size < 2 && items.length >= 6) {
    issues.push(
      "Planejamento anual: distribua conteudos entre mais de um trimestre.",
    );
  }

  return Array.from(new Set(issues));
}

export function buildPlanningQualityRetryNote(issues: string[]): string {
  return [
    "CORRECAO OBRIGATORIA - a matriz anterior nao cumpriu o contrato pedagogico:",
    ...issues.map((item) => `- ${item}`),
    "Use somente habilidades BNCC que o professor selecionou.",
    "Nao invente codigos genericos como BNCC.",
    "Evite metodologias copiadas iguais em todas as linhas.",
    "Cada linha deve refletir o conteudo especifico informado pelo professor.",
    "Mantenha exatamente uma linha por conteudo informado, sem repetir conteudo para fechar carga horaria.",
    "Distribua periodos variaveis por linha (1 a 10) de modo que a soma seja igual a carga horaria informada.",
    "Use numeroAula sequencial por trimestre (1, 2, 3...) e aulaInicio/aulaFim como faixa acumulada de periodos dentro do trimestre.",
  ].join("\n");
}

export function computePlanningQualityScore(
  issues: string[],
  warning?: string,
): number {
  return computeQualityScore(issues, warning ? [warning] : []);
}
