import type { PlanifyToolId } from "@/lib/pro/planifyTools";

export type QuantityPreset = {
  value: string;
  label: string;
};

const DEFAULT_QUANTITY: QuantityPreset[] = [
  { value: "5", label: "5 itens" },
  { value: "10", label: "10 itens" },
  { value: "15", label: "15 itens" },
];

export const QUANTITY_PRESETS_BY_TOOL: Partial<
  Record<PlanifyToolId, QuantityPreset[]>
> = {
  prova: [
    { value: "5", label: "5 questões" },
    { value: "10", label: "10 questões" },
    { value: "15", label: "15 questões" },
    { value: "20", label: "20 questões" },
  ],
  lista: [
    { value: "5", label: "5 exercícios" },
    { value: "10", label: "10 exercícios" },
    { value: "15", label: "15 exercícios" },
    { value: "20", label: "20 exercícios" },
  ],
  slides: [
    { value: "6", label: "6 slides" },
    { value: "8", label: "8 slides" },
    { value: "10", label: "10 slides" },
    { value: "12", label: "12 slides" },
    { value: "15", label: "15 slides" },
    { value: "20", label: "20 slides" },
    { value: "25", label: "25 slides" },
    { value: "30", label: "30 slides" },
  ],
  flashcards: [
    { value: "10", label: "10 cartões" },
    { value: "15", label: "15 cartões" },
    { value: "20", label: "20 cartões" },
    { value: "30", label: "30 cartões" },
  ],
  redacao: [
    { value: "2", label: "2 textos motivadores" },
    { value: "3", label: "3 textos motivadores" },
    { value: "4", label: "4 textos motivadores + preparação" },
  ],
  atividade: [
    { value: "1", label: "1 atividade" },
    { value: "2", label: "2 atividades" },
    { value: "3", label: "3 atividades" },
  ],
  "plano-aula": [
    { value: "1", label: "1 período (50 min)" },
    { value: "2", label: "2 períodos" },
    { value: "3", label: "3 períodos" },
    { value: "4", label: "4 períodos" },
    { value: "5", label: "5 períodos" },
    { value: "6", label: "6 períodos" },
  ],
  sequencia: [
    { value: "3", label: "3 aulas" },
    { value: "4", label: "4 aulas" },
    { value: "6", label: "6 aulas" },
  ],
  apostila: [
    { value: "4", label: "4 seções" },
    { value: "6", label: "6 seções" },
    { value: "8", label: "8 seções" },
  ],
  resumo: [
    { value: "1", label: "1 resumo completo" },
    { value: "2", label: "2 resumos (partes)" },
  ],
  projeto: [
    { value: "3", label: "3 etapas" },
    { value: "4", label: "4 etapas" },
    { value: "5", label: "5 etapas" },
  ],
  "mapa-mental": [
    { value: "5", label: "5 ramos" },
    { value: "6", label: "6 ramos" },
    { value: "8", label: "8 ramos" },
  ],
  cruzadinha: [
    { value: "8", label: "8 palavras" },
    { value: "10", label: "10 palavras" },
    { value: "12", label: "12 palavras" },
    { value: "15", label: "15 palavras" },
  ],
};

export function getQuantityPresets(toolId: PlanifyToolId): QuantityPreset[] {
  return QUANTITY_PRESETS_BY_TOOL[toolId] ?? DEFAULT_QUANTITY;
}

export function defaultQuantityForTool(toolId: PlanifyToolId): string {
  const presets = getQuantityPresets(toolId);
  return presets[1]?.value ?? presets[0]?.value ?? "10";
}

export const SLIDES_QUESTION_QUANTITY_PRESETS: QuantityPreset[] = [
  { value: "3", label: "3 questões" },
  { value: "5", label: "5 questões" },
  { value: "8", label: "8 questões" },
];

export function defaultSlidesQuestionQuantity(): string {
  return SLIDES_QUESTION_QUANTITY_PRESETS[0]?.value ?? "3";
}
