/**
 * Contrato do Motor Premium Unificado (materiais).
 *
 * REGRA: toda geração de material em produção passa por
 * `generatePlanifyMaterial` → middleware `runPlanifyAiJson`
 * (JSON strict + DNA pedagógico + validação Zod).
 *
 * FORA DE ESCOPO: planejamento anual/trimestral
 * (`planejamento-ai-service`, `planning-ai-service`, PlanejamentosClient).
 */

export const PLANIFY_MATERIAL_ENGINE_CONTRACT = {
  entrypoint: "generatePlanifyMaterial",
  middleware: "runPlanifyAiJson",
  dna: "planify-pedagogical-dna",
  bnccAutoRag: "enrichInputWithAutoBnccRag",
  excluded: ["planejamento-anual", "planejamento-trimestral"] as const,
} as const;
