import {
  EDUCATION_OPTIONS,
  getYearOptions,
  type EducationStage,
} from "@/lib/educacao/education-options";
import type { QuestionBankEtapa, QuestionBankFilter } from "@/types/question-bank";

const EM_SERIES = new Set(["1ª série", "2ª série", "3ª série"]);
const EF_YEARS = new Set([
  "1º ano",
  "2º ano",
  "3º ano",
  "4º ano",
  "5º ano",
  "6º ano",
  "7º ano",
  "8º ano",
  "9º ano",
]);

export function inferSerieStage(anoSerie: string): "em" | "ef" | "geral" | "unknown" {
  if (!anoSerie || anoSerie === "Geral" || anoSerie === "todos") return "geral";
  if (EM_SERIES.has(anoSerie)) return "em";
  if (EF_YEARS.has(anoSerie)) return "ef";
  return "unknown";
}

export const QUESTION_BANK_ETAPA_OPTIONS: {
  value: QuestionBankEtapa;
  label: string;
}[] = [
  { value: "todos", label: "Todos os níveis" },
  { value: "Ensino Fundamental", label: "Ensino Fundamental" },
  { value: "Ensino Médio", label: "Ensino Médio" },
];

const LEGACY_COMPONENTES = ["Ciências", "Inglês", "Arte", "Educação Física"] as const;

function collectComponents(stage: EducationStage): Set<string> {
  const config = EDUCATION_OPTIONS[stage];
  const set = new Set<string>();
  for (const comps of Object.values(config.componentsByArea)) {
    for (const component of comps) set.add(component);
  }
  return set;
}

export function inferEtapaFromAnoSerie(
  anoSerie: string,
): "Ensino Fundamental" | "Ensino Médio" | null {
  const stage = inferSerieStage(anoSerie);
  if (stage === "ef") return "Ensino Fundamental";
  if (stage === "em") return "Ensino Médio";
  return null;
}

export function getQuestionBankYearOptions(etapa: QuestionBankEtapa): string[] {
  if (etapa === "todos") {
    return [
      "todos",
      "Geral",
      ...getYearOptions("Ensino Fundamental"),
      ...getYearOptions("Ensino Médio"),
    ];
  }
  return ["todos", "Geral", ...getYearOptions(etapa)];
}

export function getQuestionBankComponenteOptions(etapa: QuestionBankEtapa): string[] {
  const all = new Set<string>(["Multicomponente"]);

  if (etapa === "todos") {
    for (const component of collectComponents("Ensino Fundamental")) all.add(component);
    for (const component of collectComponents("Ensino Médio")) all.add(component);
    for (const legacy of LEGACY_COMPONENTES) all.add(legacy);
  } else {
    for (const component of collectComponents(etapa)) all.add(component);
    if (etapa === "Ensino Fundamental") {
      for (const legacy of LEGACY_COMPONENTES) all.add(legacy);
    }
  }

  return ["todos", ...Array.from(all).sort((a, b) => a.localeCompare(b, "pt-BR"))];
}

export function resolveQuestionBankArea(
  etapa: QuestionBankEtapa,
  componente: string,
): string {
  if (etapa === "todos" || componente === "todos") return "";
  const config = EDUCATION_OPTIONS[etapa];
  if (!config) return "";
  for (const [area, components] of Object.entries(config.componentsByArea)) {
    if ((components as string[]).includes(componente)) return area;
  }
  return config.areas[0] ?? "";
}

export function normalizeQuestionBankFilterEducation(
  filter: Pick<QuestionBankFilter, "etapa" | "anoSerie" | "componente">,
  patch: Partial<Pick<QuestionBankFilter, "etapa" | "anoSerie" | "componente">> = {},
): Pick<QuestionBankFilter, "etapa" | "anoSerie" | "componente"> {
  const next = { ...filter, ...patch };
  const yearOptions = getQuestionBankYearOptions(next.etapa);
  if (!yearOptions.includes(next.anoSerie)) {
    next.anoSerie = "todos";
  }

  const componenteOptions = getQuestionBankComponenteOptions(next.etapa);
  if (!componenteOptions.includes(next.componente)) {
    next.componente = "todos";
  }

  return next;
}
