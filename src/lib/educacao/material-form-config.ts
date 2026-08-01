import type { PlanifyToolId } from "@/lib/pro/planifyTools";

/** Ferramentas em que o checkbox de gabarito faz sentido pedagógico. */
export const TOOL_IDS_WITH_GABARITO: PlanifyToolId[] = [
  "prova",
  "lista",
  "atividade",
  "redacao",
  "cruzadinha",
];

export function toolSupportsGabarito(
  toolId: PlanifyToolId,
  options?: { incluirQuestoes?: boolean },
): boolean {
  return TOOL_IDS_WITH_GABARITO.includes(toolId);
}

export type MaterialFormFieldConfig = {
  temaLabel: string;
  conteudoLabel: string;
  conteudoPlaceholder: string;
};

const DEFAULT_FORM_FIELD_CONFIG: MaterialFormFieldConfig = {
  temaLabel: "Tema (opcional)",
  conteudoLabel: "Conteúdo",
  conteudoPlaceholder:
    "Descreva o que deseja trabalhar — digite livremente, sem sugestões automáticas.",
};

const FORM_FIELD_CONFIG_BY_TOOL: Partial<
  Record<PlanifyToolId, Partial<MaterialFormFieldConfig>>
> = {
  "plano-aula": {
    conteudoLabel: "Conteúdo da aula",
    conteudoPlaceholder:
      "Descreva o que será trabalhado na aula — digite livremente.",
  },
  prova: {
    conteudoLabel: "Conteúdo da prova",
    conteudoPlaceholder:
      "Descreva o que a prova deve avaliar — digite livremente.",
  },
  lista: {
    conteudoLabel: "Conteúdo da lista",
    conteudoPlaceholder:
      "Descreva os exercícios desejados — digite livremente.",
  },
  cruzadinha: {
    conteudoLabel: "Conteúdo da cruzadinha",
    conteudoPlaceholder:
      "Descreva o vocabulário ou unidade da cruzadinha — digite livremente.",
  },
  "aula-completa": {
    conteudoLabel: "Conteúdo da aula",
    conteudoPlaceholder:
      "Descreva o que será trabalhado no pacote — digite livremente.",
  },
};

export function getMaterialFormFieldConfig(
  toolId: PlanifyToolId,
): MaterialFormFieldConfig {
  const overrides = FORM_FIELD_CONFIG_BY_TOOL[toolId] ?? {};
  return { ...DEFAULT_FORM_FIELD_CONFIG, ...overrides };
}

export function hasMaterialTopicInput(tema: string, conteudo: string): boolean {
  return Boolean(tema.trim() || conteudo.trim());
}

/** Título curto para exibição — tema explícito ou primeira linha do conteúdo. */
export function resolveMaterialDisplayTema(tema: string, conteudo: string): string {
  const trimmedTema = tema.trim();
  if (trimmedTema) return trimmedTema;

  const trimmedConteudo = conteudo.trim();
  if (!trimmedConteudo) return "";

  const firstLine =
    trimmedConteudo.split(/\r?\n/).find((line) => line.trim())?.trim() ??
    trimmedConteudo;

  if (firstLine.length <= 100) return firstLine;
  return `${firstLine.slice(0, 100)}…`;
}
