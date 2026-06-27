import {
  assessDistributionCoarseness,
  OFFICIAL_MAX_PERIODS_PER_ROW,
  splitPeriodsIntoExperienceChunks,
} from "./planning-official-contract";

export type PlanningAllocationPayload = {
  tipoPlanejamento?: string;
  cargaHoraria?: string | number;
  trimestre?: string | number;
};

export type MatrixLessonAllocatable = {
  conteudo: string;
  trimestre: number;
  numeroAula?: number;
  periodos?: number;
  aulaInicio: number;
  aulaFim: number;
};

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function normalizeSearch(value: unknown): string {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parsePlanningCargaHoraria(value: unknown, fallback: number): number {
  const parsed = parsePlanningCargaHorariaStrict(value);
  return parsed ?? fallback;
}

export function parsePlanningCargaHorariaStrict(value: unknown): number | null {
  const match = normalizeText(value).match(/\d+/);
  const parsed = match ? Number(match[0]) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function getPlanningTipo(payload: PlanningAllocationPayload): "anual" | "trimestral" {
  const raw = normalizeText(payload.tipoPlanejamento || "anual")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  return raw.includes("tri") ? "trimestral" : "anual";
}

export function getPlanningTrimestre(payload: PlanningAllocationPayload): number {
  const parsed = parsePlanningCargaHoraria(payload.trimestre, 1);
  return Math.min(Math.max(parsed, 1), 3);
}

export function contentComplexityWeight(conteudo: string): number {
  const text = normalizeSearch(conteudo);
  let weight = 1;

  if (
    /revisao|retomada|sintese|introducao|diagnostico|acolhimento|apresentacao/.test(text)
  ) {
    weight *= 0.7;
  }

  if (
    /gramatica|sintaxe|regencia|colocacao|dissertat|argument|projeto|pesquisa|monografia|geometria|funcao|equacao|redacao|producao textual/.test(
      text,
    )
  ) {
    weight *= 1.3;
  }

  if (text.length > 90) {
    weight *= 1.1;
  }

  return Math.max(0.5, weight);
}

export type LessonAllocationSlot = {
  conteudo: string;
  trimestre: number;
  numeroAula: number;
  periodos: number;
  aulaInicio: number;
  aulaFim: number;
};

function distributeTrimestres(count: number, tipo: "anual" | "trimestral", trimestreSelecionado: number): number[] {
  if (tipo === "trimestral") {
    return Array.from({ length: count }, () => trimestreSelecionado);
  }

  const chunkSize = Math.max(1, Math.ceil(count / 3));
  return Array.from({ length: count }, (_, index) => Math.min(3, Math.floor(index / chunkSize) + 1));
}

function allocateRawPeriods(conteudos: string[], cargaTotal: number): number[] {
  const count = Math.max(1, conteudos.length);
  const weights = conteudos.map((conteudo) => contentComplexityWeight(conteudo));
  const weightSum = weights.reduce((sum, value) => sum + value, 0) || count;

  const raw = weights.map((weight) => Math.max(1, Math.round((cargaTotal * weight) / weightSum)));
  let sum = raw.reduce((total, value) => total + value, 0);

  while (sum > cargaTotal) {
    let index = 0;
    for (let i = 1; i < raw.length; i += 1) {
      if (raw[i] > raw[index]) {
        index = i;
      }
    }
    if (raw[index] <= 1) {
      break;
    }
    raw[index] -= 1;
    sum -= 1;
  }

  while (sum < cargaTotal) {
    let index = 0;
    for (let i = 1; i < raw.length; i += 1) {
      if (weights[i] > weights[index]) {
        index = i;
      }
    }
    raw[index] += 1;
    sum += 1;
  }

  return raw;
}

export function computeLessonAllocation(params: {
  conteudos: string[];
  cargaTotal: number;
  tipo: "anual" | "trimestral";
  trimestreSelecionado?: number;
}): LessonAllocationSlot[] {
  const safeConteudos =
    params.conteudos.length > 0
      ? params.conteudos.map((item) => normalizeText(item)).filter(Boolean)
      : ["Conteúdo central"];
  const cargaTotal = Math.max(safeConteudos.length, params.cargaTotal);
  const trimestreSelecionado = params.trimestreSelecionado ?? 1;
  const trimestres = distributeTrimestres(safeConteudos.length, params.tipo, trimestreSelecionado);
  const periodosList = allocateRawPeriods(safeConteudos, cargaTotal);

  let cumulative = 0;

  return safeConteudos.map((conteudo, index) => {
    const periodos = periodosList[index] || 1;
    const aulaInicio = cumulative + 1;
    const aulaFim = cumulative + periodos;
    cumulative = aulaFim;

    return {
      conteudo,
      trimestre: trimestres[index],
      numeroAula: index + 1,
      periodos,
      aulaInicio,
      aulaFim,
    };
  });
}

function matrixHasOfficialPeriodDistribution(
  items: MatrixLessonAllocatable[],
  cargaTotal: number,
): boolean {
  if (!items.length) {
    return false;
  }

  const periodsSum = items.reduce((sum, item) => sum + (Number(item.periodos) || 0), 0);
  if (periodsSum !== cargaTotal) {
    return false;
  }

  if (!items.every((item) => {
    const periodos = Number(item.periodos) || 0;
    return periodos > 0 && periodos <= OFFICIAL_MAX_PERIODS_PER_ROW;
  })) {
    return false;
  }

  return !assessDistributionCoarseness(items, cargaTotal).coarse;
}

export function applyOfficialPeriodDistribution<T extends MatrixLessonAllocatable>(
  items: T[],
  cargaTotal: number,
): T[] {
  if (!items.length) {
    return items;
  }

  const targetTotal = Math.max(items.length, cargaTotal);
  const conteudos = items.map((item) => item.conteudo);
  const totalFromItems = items.reduce((sum, item) => sum + (Number(item.periodos) || 0), 0);

  const periodAllocations =
    totalFromItems === targetTotal && items.every((item) => (Number(item.periodos) || 0) > 0)
      ? items.map((item) => Number(item.periodos) || 1)
      : allocateRawPeriods(conteudos, targetTotal);

  const expanded: T[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const periods = periodAllocations[index] || 1;
    const chunks = splitPeriodsIntoExperienceChunks(periods);

    for (const chunkPeriodos of chunks) {
      expanded.push({
        ...item,
        periodos: chunkPeriodos,
      });
    }
  }

  let allocationSum = expanded.reduce((sum, item) => sum + (Number(item.periodos) || 0), 0);
  let adjustIndex = expanded.length - 1;

  while (allocationSum > targetTotal && adjustIndex >= 0) {
    const current = expanded[adjustIndex];
    const currentPeriodos = Number(current.periodos) || 1;

    if (currentPeriodos > 1) {
      expanded[adjustIndex] = { ...current, periodos: currentPeriodos - 1 };
      allocationSum -= 1;
    } else {
      adjustIndex -= 1;
    }
  }

  adjustIndex = 0;
  while (allocationSum < targetTotal) {
    const current = expanded[adjustIndex % expanded.length];
    const currentPeriodos = Number(current.periodos) || 1;

    if (currentPeriodos < OFFICIAL_MAX_PERIODS_PER_ROW) {
      expanded[adjustIndex % expanded.length] = {
        ...current,
        periodos: currentPeriodos + 1,
      };
      allocationSum += 1;
    }

    adjustIndex += 1;
    if (adjustIndex > expanded.length * (targetTotal + 1)) {
      break;
    }
  }

  return expanded;
}

export function rebalanceMatrixPeriods<T extends MatrixLessonAllocatable>(
  items: T[],
  cargaTotal: number,
  tipo: "anual" | "trimestral",
): T[] {
  if (!items.length) {
    return items;
  }

  if (matrixHasOfficialPeriodDistribution(items, cargaTotal)) {
    return items.map((item, index) => ({
      ...item,
      numeroAula: item.numeroAula || index + 1,
    }));
  }

  const expanded = applyOfficialPeriodDistribution(items, cargaTotal);
  const trimestreSelecionado = items[0]?.trimestre || 1;
  const trimestres = distributeTrimestres(expanded.length, tipo, trimestreSelecionado);

  return expanded.map((item, index) => ({
    ...item,
    trimestre: tipo === "trimestral" ? trimestreSelecionado : trimestres[index] || item.trimestre || 1,
    numeroAula: index + 1,
  }));
}

/**
 * Garante que planejamentos anuais cubram os três trimestres quando há conteúdo
 * suficiente. A IA às vezes marca só o 1º e o 2º, deixando o 3º vazio no DOCX.
 */
export function ensureAnnualTrimesterDistribution<T extends MatrixLessonAllocatable>(
  items: T[],
): T[] {
  if (items.length < 3) {
    return items;
  }

  const present = new Set<number>();
  for (const item of items) {
    const trimestre = Number(item.trimestre);
    if (Number.isFinite(trimestre) && trimestre >= 1 && trimestre <= 3) {
      present.add(trimestre);
    }
  }

  if (present.has(1) && present.has(2) && present.has(3)) {
    return items;
  }

  const chunkSize = Math.max(1, Math.ceil(items.length / 3));

  return items.map((item, index) => ({
    ...item,
    trimestre: Math.min(3, Math.floor(index / chunkSize) + 1),
  }));
}

export function finalizeMatrixLessonAllocation<T extends MatrixLessonAllocatable>(
  items: T[],
  payload: PlanningAllocationPayload,
): T[] {
  const tipo = getPlanningTipo(payload);
  const carga = parsePlanningCargaHoraria(
    payload.cargaHoraria,
    Math.max(
      items.length,
      items.reduce((sum, item) => sum + (item.periodos || 0), 0) || items.length,
    ),
  );

  const withAiPeriods = items.map((item, index) => {
    const parsedPeriodos = Number(item.periodos);
    const parsedNumeroAula = Number(item.numeroAula);

    return {
      ...item,
      numeroAula:
        Number.isFinite(parsedNumeroAula) && parsedNumeroAula > 0 ? parsedNumeroAula : index + 1,
      periodos: Number.isFinite(parsedPeriodos) && parsedPeriodos > 0 ? parsedPeriodos : 0,
    };
  });

  const hasValidPeriods = matrixHasOfficialPeriodDistribution(withAiPeriods, carga);

  const base = hasValidPeriods
    ? withAiPeriods
    : rebalanceMatrixPeriods(withAiPeriods, carga, tipo);

  let cumulative = 0;

  const allocated = base.map((item, index) => {
    const periodos = Math.max(1, item.periodos || 1);
    const aulaInicio = cumulative + 1;
    const aulaFim = cumulative + periodos;
    cumulative = aulaFim;

    return {
      ...item,
      numeroAula: item.numeroAula || index + 1,
      periodos,
      aulaInicio,
      aulaFim,
    };
  });

  if (tipo === "anual") {
    return ensureAnnualTrimesterDistribution(allocated);
  }

  return allocated;
}

export function matrixPeriodsTotal(items: MatrixLessonAllocatable[]): number {
  return items.reduce((sum, item) => sum + Math.max(0, Number(item.periodos) || 0), 0);
}

export function resolveMatrixPeriodos(item: MatrixLessonAllocatable): number {
  const parsed = Number(item.periodos);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  const range = Math.max(0, Number(item.aulaFim) - Number(item.aulaInicio) + 1);
  return range > 0 ? range : 1;
}

export function formatMatrixPeriodosLabel(item: MatrixLessonAllocatable): string {
  const periodos = resolveMatrixPeriodos(item);
  return periodos === 1 ? "1 período" : `${periodos} período(s)`;
}

export function formatMatrixAulaLabel(item: MatrixLessonAllocatable): string {
  const numeroAula = Number(item.numeroAula);
  if (Number.isFinite(numeroAula) && numeroAula > 0) {
    return String(numeroAula);
  }

  if (item.aulaInicio === item.aulaFim) {
    return String(item.aulaInicio || 1);
  }

  return `${item.aulaInicio} a ${item.aulaFim}`;
}
