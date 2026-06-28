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
          aulaInicio: index + 1,
          aulaFim: index + 1,
        } as T);

    return {
      ...base,
      conteudo,
      trimestre:
        tipo === "trimestral"
          ? trimestreSelecionado
          : trimestres[index] || base.trimestre || 1,
      numeroAula: index + 1,
      periodos: 1,
      aulaInicio: index + 1,
      aulaFim: index + 1,
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

export function computeLessonAllocation(params: {
  conteudos: string[];
  cargaTotal: number;
  tipo: "anual" | "trimestral";
  trimestreSelecionado?: number;
}): LessonAllocationSlot[] {
  void params.cargaTotal;

  const safeConteudos =
    params.conteudos.length > 0
      ? params.conteudos.map((item) => normalizeText(item)).filter(Boolean)
      : ["Conteúdo central"];
  const trimestreSelecionado = params.trimestreSelecionado ?? 1;
  const trimestres = distributeTrimestres(safeConteudos.length, params.tipo, trimestreSelecionado);

  return safeConteudos.map((conteudo, index) => {
    return {
      conteudo,
      trimestre: trimestres[index],
      numeroAula: index + 1,
      periodos: 1,
      aulaInicio: index + 1,
      aulaFim: index + 1,
    };
  });
}

export function applyOfficialPeriodDistribution<T extends MatrixLessonAllocatable>(
  items: T[],
  cargaTotal: number,
): T[] {
  if (!items.length) {
    return items;
  }

  void cargaTotal;

  return items.map((item, index) => ({
    ...item,
    numeroAula: index + 1,
    periodos: 1,
    aulaInicio: index + 1,
    aulaFim: index + 1,
  }));
}

export function rebalanceMatrixPeriods<T extends MatrixLessonAllocatable>(
  items: T[],
  cargaTotal: number,
  tipo: "anual" | "trimestral",
): T[] {
  if (!items.length) {
    return items;
  }

  void cargaTotal;

  const trimesterSelecionado = items[0]?.trimestre || 1;
  const trimestres = distributeTrimestres(items.length, tipo, trimesterSelecionado);

  return items.map((item, index) => ({
    ...item,
    trimestre: tipo === "trimestral" ? trimesterSelecionado : trimestres[index] || item.trimestre || 1,
    numeroAula: index + 1,
    periodos: 1,
    aulaInicio: index + 1,
    aulaFim: index + 1,
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

  const withAiPeriods = items.map((item, index) => {
    const parsedNumeroAula = Number(item.numeroAula);

    return {
      ...item,
      numeroAula:
        Number.isFinite(parsedNumeroAula) && parsedNumeroAula > 0 ? parsedNumeroAula : index + 1,
      periodos: 1,
    };
  });

  const allocated = withOneLessonPerContent(withAiPeriods, payload);

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
