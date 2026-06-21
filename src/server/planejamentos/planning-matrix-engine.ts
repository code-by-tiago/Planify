import {
  buildTrimestralPlansFromAnnual,
  buildTrimestralPlansFromAnnualAsync,
  type AnnualPlanningLike,
  type TrimestralPlanningLike,
} from "@/lib/planejamentos/planning-trimestral-from-annual";
import { matchBnccSkillsToContent } from "./planning-bncc-skills";
import {
  computeLessonAllocation,
  ensureAnnualTrimesterDistribution,
  getPlanningTipo,
  getPlanningTrimestre,
  parsePlanningCargaHoraria,
} from "./planning-lesson-allocation";
import { deriveExpectativaAprendizagem } from "@/lib/planejamentos/planning-annual-field-enrichment";
import { computePlanningQualityScore } from "./planning-quality";
import { splitPlanningConteudos } from "./planning-validation";
import type {
  PlanningAiPayload,
  PlanningAiResult,
  PlanningMatrixItem,
  PlanningSkill,
} from "./planning-ai-service";

export type PlanningMatrixEngineMode = "bncc" | "ai-fallback";

export type PlanningMatrixPackage = {
  annual: PlanningAiResult["planejamento"];
  trimestrais: Partial<Record<number, TrimestralPlanningLike>>;
  trimestres: number[];
  bundleDocumentCount: number;
  bundleLabels: string[];
  trimestralPlanCounts: Record<string, number>;
};

export type PlanningMatrixEngineResult = PlanningAiResult & {
  package?: PlanningMatrixPackage;
  engineMode: PlanningMatrixEngineMode;
};

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function normalizeSkill(skill: unknown): PlanningSkill {
  const record = (skill || {}) as Record<string, unknown>;
  const codigo = normalizeText(record.codigo || record.code || "BNCC");
  const descricao = normalizeText(
    record.descricao || record.description || record.habilidade || record.texto,
  )
    .replace(codigo, "")
    .replace(/^[-–—:.\s]+/, "")
    .trim();

  return {
    codigo,
    descricao: descricao || "Descrição não informada.",
    conteudo: normalizeText(record.conteudo || record["conteúdo"]),
    etapa: normalizeText(record.etapa),
    anoSerie: normalizeText(record.anoSerie),
    area: normalizeText(record.area),
    componente: normalizeText(record.componente),
  };
}

function buildPedagogicalFields(
  conteudo: string,
  index: number,
  payload: PlanningAiPayload,
  habilidades: PlanningSkill[],
): Pick<
  PlanningMatrixItem,
  "objetivos" | "metodologia" | "materiais" | "recursos" | "etapas" | "avaliacao" | "evidencias"
> {
  const observacoes = normalizeText(payload.observacoes);
  const expectativasDasHabilidades = habilidades
    .map((skill) => normalizeText(skill.descricao))
    .filter(Boolean)
    .join("\n");

  const objetivos =
    expectativasDasHabilidades ||
    deriveExpectativaAprendizagem(conteudo, habilidades);

  const metodologia = `Desenvolvimento de ${conteudo}: acolhimento e contextualização, problematização, prática orientada, sistematização dos registros, síntese com devolutiva formativa.`;

  const etapas = [
    `1. Contextualização e mobilização de conhecimentos prévios sobre ${conteudo}.`,
    `2. Problematização e exploração guiada do conteúdo.`,
    `3. Prática orientada com registros e mediação do professor.`,
    `4. Sistematização e socialização das aprendizagens.`,
    `5. Síntese, devolutiva e avaliação formativa sobre ${conteudo}.`,
  ].join("\n");

  return {
    objetivos,
    metodologia,
    materiais: "Caderno, fichas de atividade, material impresso e textos de apoio.",
    recursos:
      index % 2 === 0
        ? "Quadro, livro didático, projetor e recursos digitais disponíveis."
        : "Quadro, slides, fontes de consulta, projetor e registros do professor.",
    etapas,
    avaliacao: `Avaliação formativa por participação, registros, resolução das atividades e evidências sobre ${conteudo}.`,
    evidencias: `Registros, produções e participação nas atividades sobre ${conteudo}; devolutivas do professor.`,
  };
}

function buildDeterministicMatrix(payload: PlanningAiPayload): PlanningMatrixItem[] {
  const tipo = getPlanningTipo(payload);
  const conteudos = splitPlanningConteudos(payload.conteudos);
  const safeConteudos = conteudos.length > 0 ? conteudos : ["Conteúdo central"];
  const trimestreSelecionado = getPlanningTrimestre(payload);
  const cargaTotal = parsePlanningCargaHoraria(
    payload.cargaHoraria,
    Math.max(safeConteudos.length * 2, safeConteudos.length),
  );

  const skills = Array.isArray(payload.habilidadesSelecionadas)
    ? payload.habilidadesSelecionadas.map(normalizeSkill)
    : [];

  const slots = computeLessonAllocation({
    conteudos: safeConteudos,
    cargaTotal,
    tipo,
    trimestreSelecionado,
  });

  const draft = slots.map((slot, index) => {
    const habilidades = matchBnccSkillsToContent(slot.conteudo, skills, payload, index);

    return {
      ...slot,
      habilidades,
      ...buildPedagogicalFields(slot.conteudo, index, payload, habilidades),
    };
  });

  if (tipo === "anual") {
    return ensureAnnualTrimesterDistribution(draft);
  }

  return draft;
}

type BuildTrimestralOptions = import("@/lib/planejamentos/planning-trimestral-from-annual").BuildTrimestralOptions;

export function assembleTrimestralPackage(
  annual: AnnualPlanningLike,
  trimestres: number[],
  options?: BuildTrimestralOptions,
): PlanningMatrixPackage {
  const unique = Array.from(
    new Set(trimestres.filter((value) => value >= 1 && value <= 3)),
  ).sort((a, b) => a - b);

  const trimestrais = buildTrimestralPlansFromAnnual(annual, unique, options);
  return buildPackageSnapshot(annual, unique, trimestrais);
}

export async function assembleTrimestralPackageAsync(
  annual: AnnualPlanningLike,
  trimestres: number[],
  options?: BuildTrimestralOptions,
): Promise<PlanningMatrixPackage> {
  const unique = Array.from(
    new Set(trimestres.filter((value) => value >= 1 && value <= 3)),
  ).sort((a, b) => a - b);

  const trimestrais = await buildTrimestralPlansFromAnnualAsync(annual, unique, {
    ...options,
    useAiExpansion: options?.useAiExpansion ?? true,
  });
  return buildPackageSnapshot(annual, unique, trimestrais);
}

function buildPackageSnapshot(
  annual: AnnualPlanningLike,
  unique: number[],
  trimestrais: Partial<Record<number, TrimestralPlanningLike>>,
): PlanningMatrixPackage {
  const trimestralPlanCounts = Object.fromEntries(
    Object.entries(trimestrais).map(([key, plan]) => [key, plan?.conteudos?.length ?? 0]),
  );

  const bundleLabels = ["Anual"];
  for (const trimestre of unique) {
    if (trimestrais[trimestre]?.conteudos?.length) {
      bundleLabels.push(`${trimestre}º trimestre`);
    }
  }

  return {
    annual: annual as PlanningAiResult["planejamento"],
    trimestrais,
    trimestres: unique,
    bundleDocumentCount: bundleLabels.length,
    bundleLabels,
    trimestralPlanCounts,
  };
}

/**
 * Motor único Planify para matriz pedagógica determinística (sem Gemini).
 * Distribui carga por complexidade do conteúdo, pareia BNCC e monta pacote anual+trimestres.
 */
export function runPlanningMatrixEngine(
  payload: PlanningAiPayload,
  options?: {
    trimestres?: number[];
    engineMode?: PlanningMatrixEngineMode;
    warning?: string;
  },
): PlanningMatrixEngineResult {
  const tipo = getPlanningTipo(payload);
  const trimestreSelecionado = getPlanningTrimestre(payload);
  const matrix = buildDeterministicMatrix(payload);
  const engineMode = options?.engineMode ?? "bncc";

  const annual: PlanningAiResult["planejamento"] = {
    tipoPlanejamento: tipo,
    titulo:
      tipo === "trimestral"
        ? `Planejamento trimestral — ${trimestreSelecionado}º trimestre`
        : "Planejamento anual",
    resumo:
      engineMode === "bncc"
        ? "Matriz montada pelo motor BNCC Planify: conteúdos, habilidades selecionadas, distribuição inteligente de períodos e trimestres alinhada ao modelo oficial."
        : "Matriz estruturada em modo seguro a partir dos conteúdos e habilidades BNCC informados.",
    conteudos: matrix,
  };

  const trimestres = options?.trimestres ?? [];
  const packageResult =
    tipo === "anual" && trimestres.length > 0
      ? assembleTrimestralPackage(annual, trimestres, {
          cargaHoraria: String(payload.cargaHoraria ?? ""),
          componenteCurricular: String(
            payload.componenteCurricular || payload.disciplina || payload.discipline || "",
          ),
        })
      : undefined;

  return {
    success: true,
    usedAI: false,
    warning: options?.warning,
    planejamento: annual,
    qualityScore: computePlanningQualityScore([]),
    qualityIssues: [],
    engineMode,
    package: packageResult,
  };
}

export function generatePlanningFromBncc(
  payload: PlanningAiPayload,
  trimestres: number[] = [],
): PlanningMatrixEngineResult {
  return runPlanningMatrixEngine(payload, {
    trimestres,
    engineMode: "bncc",
  });
}
