import type { PlanningMatrixItem } from "@/server/planejamentos/planning-ai-service";
import {
  deriveExpectativaAprendizagem,
  enrichObjetoConhecimento,
  enrichUnidadeTematica,
  formatHabilidadesBnccAnual,
  resolveWeeklyPeriodsFromPayload,
} from "@/lib/planejamentos/planning-annual-field-enrichment";
import { extractAnnualItemsForTrimester } from "@/lib/planejamentos/planning-trimestral-from-annual";
import { deduplicateWeekFields } from "@/lib/planejamentos/planning-trimestral-similarity";
import type {
  PlanningMatrixItemWithSemanas,
  TrimestralAulaPlan,
  TrimestralPlanoValidado,
  TrimestralSemanaPlan,
} from "@/lib/planejamentos/planning-trimestral-types";
import type { AnnualPlanningLike } from "@/lib/planejamentos/planning-trimestral-from-annual";

const AULA_FUNCOES = [
  "introdução",
  "desenvolvimento",
  "prática orientada",
  "aprofundamento",
  "revisão e avaliação formativa",
] as const;

const METODOLOGIA_ORG = [
  "Trabalho em grupo",
  "Atividade em duplas",
  "Produção individual",
  "Discussão em plenária",
  "Rodízio de estações",
] as const;

const BNCC_FASES = [
  "acolhimento e contextualização",
  "problematização e mobilização de conhecimentos prévios",
  "prática orientada com mediação do professor",
  "sistematização e registro das aprendizagens",
  "síntese, devolutiva e avaliação formativa",
] as const;

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function splitList(text: string): string[] {
  return text
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitEtapasAnual(etapas: string): string[] {
  const text = normalizeText(etapas);
  if (!text) {
    return [];
  }

  const numbered = text
    .split(/\n?(?=\d+[\.\)\-:]\s+)/)
    .map((part) => part.replace(/^\d+[\.\)\-:]\s*/, "").trim())
    .filter(Boolean);

  if (numbered.length > 1) {
    return numbered;
  }

  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines;
  }

  return [text];
}

function splitMetodologiaFases(metodologia: string): string[] {
  const clauses = normalizeText(metodologia)
    .split(/[,;]\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 8);

  if (clauses.length >= 2) {
    return clauses;
  }

  return [...BNCC_FASES];
}

/** ETAPA 3: microtemas pedagógicos derivados somente do item anual. */
export function extractMicrotemasFromAnnualItem(item: PlanningMatrixItem): string[] {
  const fromEtapas = splitEtapasAnual(item.etapas || "");
  if (fromEtapas.length >= 2) {
    return fromEtapas.slice(0, 5);
  }

  const fromMetodologia = splitMetodologiaFases(item.metodologia || "");
  const fromObjetivos = normalizeText(item.objetivos)
    .split(/[.;]\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 12);

  const skillHints = (item.habilidades || [])
    .map((skill) => normalizeText(skill.descricao))
    .filter((desc) => desc.length > 15)
    .slice(0, 2);

  const merged = [...fromEtapas, ...fromMetodologia, ...fromObjetivos, ...skillHints].filter(
    Boolean,
  );

  const unique: string[] = [];
  const seen = new Set<string>();

  for (const entry of merged) {
    const key = entry.toLowerCase().slice(0, 40);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(entry);
  }

  if (unique.length === 0) {
    return [`Estudo de ${item.conteudo}`];
  }

  while (unique.length < 5) {
    const fase = BNCC_FASES[unique.length % BNCC_FASES.length];
    unique.push(`${fase} sobre ${item.conteudo}`);
  }

  return unique.slice(0, 5);
}

function resolveActiveWeekCount(item: PlanningMatrixItem, weeklyPeriods: number): number {
  const periodos = Math.max(1, Number(item.periodos) || 1);
  const weeksFromPeriodos =
    weeklyPeriods > 0 ? Math.max(1, Math.ceil(periodos / weeklyPeriods)) : periodos;

  return Math.min(5, Math.max(1, weeksFromPeriodos));
}

function partitionList(items: string[], buckets: number): string[] {
  if (buckets <= 0 || items.length === 0) {
    return [];
  }

  const result: string[] = [];
  for (let index = 0; index < buckets; index += 1) {
    const item = items[index % items.length];
    result.push(item);
  }
  return result;
}

function buildWeekPlan(
  weekIndex: number,
  microtema: string,
  item: PlanningMatrixItem,
  materiaisList: string[],
  recursosList: string[],
): Omit<TrimestralSemanaPlan, "semana" | "microtemas"> {
  const conteudo = item.conteudo;
  const org = METODOLOGIA_ORG[weekIndex % METODOLOGIA_ORG.length];
  const fase = BNCC_FASES[weekIndex % BNCC_FASES.length];
  const skill = item.habilidades?.[0];
  const skillRef = skill?.codigo ? `${skill.codigo}` : "BNCC";
  const materiais = materiaisList[weekIndex] || materiaisList[0] || "Caderno e fichas";
  const recursos = recursosList[weekIndex % Math.max(recursosList.length, 1)] || recursosList[0] || "Quadro e material didático";
  const microtemaCap = microtema.charAt(0).toUpperCase() + microtema.slice(1);

  return {
    metodologia: `${org} na ${fase} de ${conteudo}: os estudantes trabalham ${microtemaCap.toLowerCase()}, com mediação que favorece a habilidade ${skillRef}.`,
    materiais: `${materiais}; ${recursos}.`,
    etapas: `${weekIndex + 1}. ${microtemaCap}: leitura orientada, discussão e registro individual sobre ${conteudo}.`,
    evidencias: `Participação na ${fase}, qualidade dos registros sobre ${microtemaCap.toLowerCase()} e articulação com ${skillRef}.`,
    instrumentos: `Ficha de acompanhamento da semana ${weekIndex + 1} com critérios de ${skillRef} e devolutiva oral ao final do encontro.`,
  };
}

function buildAulaPlan(
  item: PlanningMatrixItem,
  aulaIndex: number,
  weeklyPeriods: number,
  component: string,
): TrimestralAulaPlan {
  const microtemas = extractMicrotemasFromAnnualItem(item);
  const activeWeeks = resolveActiveWeekCount(item, weeklyPeriods);
  const materiaisList = splitList(
    [item.materiais, item.recursos].filter(Boolean).join(", "),
  );
  const recursosList = splitList(item.recursos || "");

  const distributedMicrotemas = partitionList(microtemas, activeWeeks);

  const semanas: TrimestralSemanaPlan[] = Array.from({ length: 5 }, (_, index) => {
    const semana = (index + 1) as TrimestralSemanaPlan["semana"];

    if (index >= activeWeeks) {
      return {
        semana,
        microtemas: [],
        metodologia: "",
        materiais: "",
        etapas: "",
        evidencias: "",
        instrumentos: "",
      };
    }

    const microtema = distributedMicrotemas[index] || microtemas[index] || item.conteudo;
    const weekFields = buildWeekPlan(index, microtema, item, materiaisList, recursosList);

    return {
      semana,
      microtemas: [microtema],
      ...weekFields,
    };
  });

  const funcaoAula = AULA_FUNCOES[aulaIndex % AULA_FUNCOES.length];

  return {
    itemAnual: item,
    funcaoAula,
    unidadeTematica: enrichUnidadeTematica(item.conteudo, component, item.habilidades || []),
    objetoConhecimento: enrichObjetoConhecimento(item.conteudo, item.habilidades || []),
    habilidades: formatHabilidadesBnccAnual(item.habilidades || []),
    expectativas: deriveExpectativaAprendizagem(item.conteudo, item.habilidades || []),
    projetos: `Atividades integradoras de ${funcaoAula} sobre ${item.conteudo}: leitura, pesquisa, produção e socialização.`,
    semanas,
  };
}

/**
 * Pipeline completo (etapas 1–7): anual → plano trimestral validado.
 * O DOCX (etapa 8) consome apenas o resultado desta função.
 */
export type TrimestralPipelineOptions = {
  cargaHoraria?: string;
  componenteCurricular?: string;
  etapa?: string;
  anoSerie?: string;
  elevarQualidade?: boolean;
  /** Tenta expansão com IA (Gemini); fallback determinístico se indisponível. */
  useAiExpansion?: boolean;
};

function finalizePlanoFromAulas(
  aulas: TrimestralAulaPlan[],
  trimestre: number,
): TrimestralPlanoValidado {
  const { aulas: validatedAulas, maxSimilaridade } = deduplicateWeekFields(aulas);

  return {
    trimestre,
    aulas: validatedAulas,
    validadoEm: new Date().toISOString(),
    maxSimilaridade,
  };
}

export async function runTrimestralPipelineOnItemsAsync(
  items: PlanningMatrixItem[],
  trimestre: number,
  options?: TrimestralPipelineOptions,
): Promise<TrimestralPlanoValidado> {
  if (options?.useAiExpansion !== false && process.env.GEMINI_API_KEY) {
    const { expandTrimestralAulasWithAI } = await import(
      "@/server/planejamentos/planning-trimestral-ai-expander"
    );
    const aiAulas = await expandTrimestralAulasWithAI(items, trimestre, {
      cargaHoraria: options?.cargaHoraria,
      componenteCurricular: options?.componenteCurricular,
      etapa: options?.etapa,
      anoSerie: options?.anoSerie,
      elevarQualidade: options?.elevarQualidade,
    });

    if (aiAulas && aiAulas.length === items.length) {
      return finalizePlanoFromAulas(aiAulas, trimestre);
    }
  }

  return runTrimestralPipelineOnItems(items, trimestre, options);
}

export async function runTrimestralPipelineAsync(
  annual: AnnualPlanningLike,
  trimestre: number,
  options?: TrimestralPipelineOptions,
): Promise<TrimestralPlanoValidado> {
  const extracted = extractAnnualItemsForTrimester(annual.conteudos, trimestre);
  return runTrimestralPipelineOnItemsAsync(extracted, trimestre, options);
}

export function runTrimestralPipelineOnItems(
  items: PlanningMatrixItem[],
  trimestre: number,
  options?: TrimestralPipelineOptions,
): TrimestralPlanoValidado {
  const weeklyPeriods = resolveWeeklyPeriodsFromPayload(options?.cargaHoraria ?? "");
  const component = options?.componenteCurricular ?? "";

  const aulas = items.map((item, index) =>
    buildAulaPlan(item, index, weeklyPeriods, component),
  );

  return finalizePlanoFromAulas(aulas, trimestre);
}

export function runTrimestralPipeline(
  annual: AnnualPlanningLike,
  trimestre: number,
  options?: TrimestralPipelineOptions,
): TrimestralPlanoValidado {
  const extracted = extractAnnualItemsForTrimester(annual.conteudos, trimestre);
  return runTrimestralPipelineOnItems(extracted, trimestre, options);
}

/** Converte plano validado em itens de matriz com `semanas` para o DOCX. */
export function matrixItemsFromTrimestralPlano(
  plano: TrimestralPlanoValidado,
  trimestre: number,
): PlanningMatrixItemWithSemanas[] {
  let cumulative = 0;

  return plano.aulas.map((aula, index) => {
    const item = aula.itemAnual;
    const periodos = Math.max(1, Number(item.periodos) || 1);
    const aulaInicio = cumulative + 1;
    const aulaFim = cumulative + periodos;
    cumulative = aulaFim;

    return {
      ...item,
      trimestre,
      numeroAula: index + 1,
      periodos,
      aulaInicio,
      aulaFim,
      semanas: aula.semanas,
      funcaoAula: aula.funcaoAula,
    };
  });
}
