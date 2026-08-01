import type { PlanningMatrixItem } from "@/server/planejamentos/planning-ai-service";

export const PLANNING_ANNUAL_SNAPSHOT_KEY = "planify_matriz_anual";

export type PlanningAnnualSnapshot = {
  savedAt: string;
  parentAnnualKey?: string;
  form: {
    escola: string;
    professor: string;
    etapa: string;
    anoSerie: string;
    areaConhecimento: string;
    componenteCurricular: string;
    cargaHoraria: string;
    objetivos: string;
    observacoes: string;
  };
  planning: {
    titulo?: string;
    resumo?: string;
    conteudos: PlanningMatrixItem[];
  };
};

function normalizeSnapshot(raw: unknown): PlanningAnnualSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const planning = record.planning as PlanningAnnualSnapshot["planning"] | undefined;
  if (!planning?.conteudos?.length) return null;

  const formRaw = (record.form || {}) as Record<string, unknown>;
  return {
    savedAt: String(record.savedAt || record.updatedAt || new Date().toISOString()),
    parentAnnualKey: String(record.parentAnnualKey || "").trim() || undefined,
    form: {
      escola: String(formRaw.escola || ""),
      professor: String(formRaw.professor || ""),
      etapa: String(formRaw.etapa || ""),
      anoSerie: String(formRaw.anoSerie || ""),
      areaConhecimento: String(formRaw.areaConhecimento || ""),
      componenteCurricular: String(formRaw.componenteCurricular || ""),
      cargaHoraria: String(formRaw.cargaHoraria || ""),
      objetivos: String(formRaw.objetivos || formRaw.objetivosGerais || ""),
      observacoes: String(formRaw.observacoes || ""),
    },
    planning: {
      titulo: planning.titulo,
      resumo: planning.resumo,
      conteudos: planning.conteudos,
    },
  };
}

export function readPlanningAnnualSnapshot(): PlanningAnnualSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLANNING_ANNUAL_SNAPSHOT_KEY);
    if (!raw) return null;
    return normalizeSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function savePlanningAnnualSnapshot(
  form: {
    escola: string;
    professor: string;
    etapa: string;
    anoSerie: string;
    areaConhecimento: string;
    componenteCurricular: string;
    cargaHoraria: string;
    objetivos: string;
    observacoes: string;
    tipoPlanejamento?: string;
  },
  planning: PlanningAnnualSnapshot["planning"],
  options?: { parentAnnualKey?: string },
): void {
  if (typeof window === "undefined") return;
  if (form.tipoPlanejamento && form.tipoPlanejamento !== "anual") return;

  const snapshot: PlanningAnnualSnapshot = {
    savedAt: new Date().toISOString(),
    parentAnnualKey: options?.parentAnnualKey?.trim() || undefined,
    form: {
      escola: form.escola,
      professor: form.professor,
      etapa: form.etapa,
      anoSerie: form.anoSerie,
      areaConhecimento: form.areaConhecimento,
      componenteCurricular: form.componenteCurricular,
      cargaHoraria: form.cargaHoraria,
      objetivos: form.objetivos,
      observacoes: form.observacoes,
    },
    planning,
  };

  localStorage.setItem(PLANNING_ANNUAL_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export function buildPlanningAnnualContextBlock(
  snapshot: PlanningAnnualSnapshot,
): string {
  const rows = snapshot.planning.conteudos.slice(0, 12);
  return [
    "CONSONÂNCIA OBRIGATÓRIA COM O PLANO ANUAL DO PROFESSOR:",
    snapshot.planning.titulo
      ? `Título do anual: ${snapshot.planning.titulo}`
      : "",
    snapshot.planning.resumo
      ? `Resumo do anual: ${snapshot.planning.resumo}`
      : "",
    "Diretrizes herdadas (não contradizer progressão, conteúdos-chave nem competências):",
    ...rows.map((row, index) => {
      const skills = (row.habilidades || [])
        .slice(0, 3)
        .map((skill) => skill.codigo)
        .join(", ");
      return `${index + 1}. T${row.trimestre} · ${row.conteudo} · objetivos: ${row.objetivos} · metodologia: ${row.metodologia}${skills ? ` · BNCC: ${skills}` : ""}`;
    }),
    "O trimestral deve DETALHAR e RESPEITAR o anual — sem reiniciar do zero nem trocar a sequência pedagógica.",
  ]
    .filter(Boolean)
    .join("\n");
}
