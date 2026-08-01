/**
 * Contrato do Motor Premium Unificado (materiais).
 *
 * REGRA: toda geração de material em produção passa por
 * `generatePlanifyMaterial` → middleware `runPlanifyAiJson`
 * (JSON strict + DNA pedagógico + validação Zod).
 *
 * Ferramentas dedicadas alinhadas ao mesmo DNA:
 * - PEI / Correção → `runPlanifyAiJson`
 * - Inclusão → `runPlanifyAiText`
 *
 * FORA DE ESCOPO: planejamento anual/trimestral
 * (`planejamento-ai-service`, `planning-ai-service`, PlanejamentosClient).
 */

export const PLANIFY_MATERIAL_ENGINE_CONTRACT = {
  entrypoint: "generatePlanifyMaterial",
  middleware: "runPlanifyAiJson",
  textMiddleware: "runPlanifyAiText",
  dna: "planify-pedagogical-dna",
  bnccAutoRag: "enrichInputWithAutoBnccRag",
  dedicatedAligned: ["pei", "inclusao", "correcao-ia"] as const,
  excluded: ["planejamento-anual", "planejamento-trimestral"] as const,
} as const;
