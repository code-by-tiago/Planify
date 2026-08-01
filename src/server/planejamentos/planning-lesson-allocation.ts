import {
  OFFICIAL_MAX_PERIODS_PER_ROW,
} from "./planning-official-contract";

export type PlanningAllocationPayload = {
  tipoPlanejamento?: string;
  cargaHoraria?: string | number;
  trimestre?: string | number;
  conteudos?: string | string[];
  conteudo?: string;
  contents?: string | string[];
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

function splitPayloadContents(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => splitPayloadContents(item));
  }

  return normalizeText(value)
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function contentKey(value: unknown): string {
  return normalizeSearch(value)
    .replace(/\b(parte|aula|semana)\s*\d+\b/g, "")
    .replace(/\b[ivx]+\b$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getPayloadContents(payload: PlanningAllocationPayload): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const conteudo of [
    ...splitPayloadContents(payload.conteudos),
    ...splitPayloadContents(payload.conteudo),
    ...splitPayloadContents(payload.contents),
  ]) {
    const key = contentKey(conteudo);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(conteudo);
  }

  return result;
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

function scoreCandidateForContent(
  item: MatrixLessonAllocatable,
  content: string,
): number {
  const itemKey = contentKey(item.conteudo);
  const targetKey = contentKey(content);
  let score = 0;

  if (itemKey === targetKey) score += 100;
  else if (itemKey.includes(targetKey) || targetKey.includes(itemKey)) score += 60;

  const record = item as unknown as Record<string, unknown>;
  for (const field of [
    "objetivos",
    "metodologia",
    "recursos",
    "materiais",
    "etapas",
    "avaliacao",
    "evidencias",
  ]) {
    if (normalizeText(record[field]).length >= 20) score += 3;
  }

  const habilidades = record.habilidades;
  if (Array.isArray(habilidades) && habilidades.length > 0) score += 5;

  return score;
}

function chooseCanonicalSource<T extends MatrixLessonAllocatable>(
  items: T[],
  content: string,
  used: Set<number>,
): T | null {
  let best: { item: T; index: number; score: number } | null = null;

  for (let index = 0; index < items.length; index += 1) {
    if (used.has(index)) continue;

    const item = items[index];
    const score = scoreCandidateForContent(item, content);
    if (score <= 0) continue;

    if (!best || score > best.score) {
      best = { item, index, score };
    }
  }

  if (!best) return null;

  used.add(best.index);
  return best.item;
}

function withOneLessonPerContent<T extends MatrixLessonAllocatable>(
  items: T[],
  payload: PlanningAllocationPayload,
): T[] {
  const canonicalFromPayload = getPayloadContents(payload);
  const canonicalContents =
    canonicalFromPayload.length > 0
      ? canonicalFromPayload
      : items
          .map((item) => normalizeText(item.conteudo))
          .filter((conteudo, index, all) => {
            const key = contentKey(conteudo);
            return key && all.findIndex((candidate) => contentKey(candidate) === key) === index;
          });

  if (!canonicalContents.length) {
    return items;
  }

  const used = new Set<number>();
  const tipo = getPlanningTipo(payload);
  const trimestreSelecionado = getPlanningTrimestre(payload);
  const trimestres = distributeTrimestres(canonicalContents.length, tipo, trimestreSelecionado);

  return canonicalContents.map((conteudo, index) => {
    const source = chooseCanonicalSource(items, conteudo, used);
    const base = source
      ? { ...source }
      : ({
          conteudo,
          trimestre: trimestres[index] || trimestreSelecionado,
          aulaInicio: 0,
          aulaFim: 0,
        } as T);

    return {
      ...base,
      conteudo,
      trimestre:
        tipo === "trimestral"
          ? trimestreSelecionado
          : trimestres[index] || base.trimestre || 1,
    };
  });
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

export function allocateRawPeriods(conteudos: string[], cargaTotal: number): number[] {
  const count = Math.max(1, conteudos.length);
  const weights = conteudos.map((conteudo) => contentComplexityWeight(conteudo));
  const weightSum = weights.reduce((sum, value) => sum + value, 0) || count;
  const rowMax = Math.max(OFFICIAL_MAX_PERIODS_PER_ROW, Math.ceil(cargaTotal / count));

  const raw = weights.map((weight) =>
    Math.min(rowMax, Math.max(1, Math.round((cargaTotal * weight) / weightSum))),
  );
  let sum = raw.reduce((total, value) => total + value, 0);

  while (sum > cargaTotal) {
    let index = -1;
    for (let i = 0; i < raw.length; i += 1) {
      if (raw[i] > 1 && (index < 0 || raw[i] > raw[index])) {
        index = i;
      }
    }
    if (index < 0) break;
    raw[index] -= 1;
    sum -= 1;
  }

  while (sum < cargaTotal) {
    let index = -1;
    for (let i = 0; i < raw.length; i += 1) {
      if (raw[i] < rowMax && (index < 0 || weights[i] > weights[index])) {
        index = i;
      }
    }
    if (index < 0) break;
    raw[index] += 1;
    sum += 1;
  }

  return raw.map((value) => Math.max(1, value));
}

function matrixPeriodsMatchCarga(
  items: MatrixLessonAllocatable[],
  cargaTotal: number,
): boolean {
  if (!items.length) return false;

  const periodsSum = items.reduce((sum, item) => sum + (Number(item.periodos) || 0), 0);
  if (periodsSum !== cargaTotal) return false;

  const rowMax = Math.max(
    OFFICIAL_MAX_PERIODS_PER_ROW,
    Math.ceil(cargaTotal / Math.max(1, items.length)),
  );

  return items.every((item) => {
    const periodos = Number(item.periodos) || 0;
    return periodos >= 1 && periodos <= rowMax;
  });
}

function assignPeriodosToRows<T extends MatrixLessonAllocatable>(
  items: T[],
  cargaTotal: number,
): T[] {
  const conteudos = items.map((item) => item.conteudo);
  const targetTotal = Math.max(items.length, cargaTotal);

  const aiPeriods = items.map((item) => Number(item.periodos) || 0);
  const aiSum = aiPeriods.reduce((sum, value) => sum + value, 0);
  const aiValid =
    aiSum === targetTotal &&
    aiPeriods.every((value) => value >= 1 && value <= Math.max(OFFICIAL_MAX_PERIODS_PER_ROW, Math.ceil(targetTotal / Math.max(1, items.length))));

  const periodAllocations = aiValid ? aiPeriods : allocateRawPeriods(conteudos, targetTotal);

  return items.map((item, index) => ({
    ...item,
    periodos: periodAllocations[index] || 1,
  }));
}

function renumberPerTrimester<T extends MatrixLessonAllocatable>(items: T[]): T[] {
  const counters = new Map<number, number>();

  return items.map((item) => {
    const trimestre = Number(item.trimestre) || 1;
    const next = (counters.get(trimestre) || 0) + 1;
    counters.set(trimestre, next);

    return {
      ...item,
      numeroAula: next,
    };
  });
}

function assignAulaRangesPerTrimester<T extends MatrixLessonAllocatable>(items: T[]): T[] {
  const cumulativeByTrimester = new Map<number, number>();

  return items.map((item) => {
    const trimestre = Number(item.trimestre) || 1;
    const periodos = Math.max(1, Number(item.periodos) || 1);
    const cumulative = cumulativeByTrimester.get(trimestre) || 0;
    const aulaInicio = cumulative + 1;
    const aulaFim = cumulative + periodos;
    cumulativeByTrimester.set(trimestre, aulaFim);

    return {
      ...item,
      periodos,
      aulaInicio,
      aulaFim,
    };
  });
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

  const draft = safeConteudos.map((conteudo, index) => ({
    conteudo,
    trimestre: trimestres[index],
    periodos: periodosList[index] || 1,
    aulaInicio: 0,
    aulaFim: 0,
  }));

  return assignAulaRangesPerTrimester(
    renumberPerTrimester(
      draft.map((item) => ({
        ...item,
        numeroAula: 0,
      })),
    ),
  ) as LessonAllocationSlot[];
}

export function applyOfficialPeriodDistribution<T extends MatrixLessonAllocatable>(
  items: T[],
  cargaTotal: number,
): T[] {
  if (!items.length) {
    return items;
  }

  const withPeriodos = assignPeriodosToRows(items, Math.max(items.length, cargaTotal));
  return assignAulaRangesPerTrimester(renumberPerTrimester(withPeriodos));
}

export function rebalanceMatrixPeriods<T extends MatrixLessonAllocatable>(
  items: T[],
  cargaTotal: number,
  tipo: "anual" | "trimestral",
): T[] {
  if (!items.length) {
    return items;
  }

  const targetTotal = Math.max(items.length, cargaTotal);

  if (matrixPeriodsMatchCarga(items, targetTotal)) {
    return assignAulaRangesPerTrimester(renumberPerTrimester(items));
  }

  const trimestreSelecionado = items[0]?.trimestre || 1;
  const withPeriodos = assignPeriodosToRows(items, targetTotal);

  const trimestres = distributeTrimestres(withPeriodos.length, tipo, trimestreSelecionado);

  const withTrimestres = withPeriodos.map((item, index) => ({
    ...item,
    trimestre: tipo === "trimestral" ? trimestreSelecionado : trimestres[index] || item.trimestre || 1,
  }));

  return assignAulaRangesPerTrimester(renumberPerTrimester(withTrimestres));
}

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

  const redistributed = items.map((item, index) => ({
    ...item,
    trimestre: Math.min(3, Math.floor(index / chunkSize) + 1),
  }));

  return assignAulaRangesPerTrimester(renumberPerTrimester(redistributed));
}

export function finalizeMatrixLessonAllocation<T extends MatrixLessonAllocatable>(
  items: T[],
  payload: PlanningAllocationPayload,
): T[] {
  const tipo = getPlanningTipo(payload);
  const canonicalCount = Math.max(
    getPayloadContents(payload).length,
    items.length,
    1,
  );
  const carga = parsePlanningCargaHoraria(payload.cargaHoraria, canonicalCount);

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

  const deduped = withOneLessonPerContent(withAiPeriods, payload);
  const targetTotal = Math.max(deduped.length, carga);
  const withPeriodos = matrixPeriodsMatchCarga(deduped, targetTotal)
    ? deduped
    : assignPeriodosToRows(deduped, targetTotal);

  let allocated = assignAulaRangesPerTrimester(renumberPerTrimester(withPeriodos));

  if (tipo === "anual") {
    allocated = ensureAnnualTrimesterDistribution(allocated);
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
