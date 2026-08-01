/**
 * Configuração da camada de IA do Planify.
 *
 * Este arquivo define tipos e constantes que podem ser importados em qualquer
 * camada (client ou server). NÃO lê variáveis de ambiente nem expõe segredos.
 *
 * A leitura de GEMINI_API_KEY e a seleção de modelo ocorrem exclusivamente
 * em src/server/ai/gemini-client.ts — nunca no frontend.
 */

/**
 * Tier de modelo de IA.
 *
 * - "default"  → Gemini 2.5 Flash (padrão para a maioria das ferramentas)
 * - "advanced" → Gemini 2.5 Pro (reservado para tarefas pesadas no backend)
 *
 * O professor nunca vê esses nomes. A interface usa apenas "IA".
 */
export type AIModelTier = "default" | "advanced";

/**
 * Identificadores de tarefas que requerem o modelo avançado.
 * Adicionados aqui para que o backend possa tomar a decisão de forma
 * centralizada, sem lógica espalhada por múltiplos arquivos.
 */
export const ADVANCED_AI_TASKS = [
  "planejamento-anual-completo",
  "planejamento-revisao-profunda",
  "documento-longo-melhoria",
  "analise-pedagogica-complexa",
  "sequencia-multiaula-extensa",
] as const;

export type AdvancedAITask = (typeof ADVANCED_AI_TASKS)[number];

/**
 * Retorna o tier de modelo adequado para uma tarefa.
 * Usado somente no backend ao montar a chamada de geração.
 */
export function getModelTierForTask(task: string): AIModelTier {
  return ADVANCED_AI_TASKS.includes(task as AdvancedAITask)
    ? "advanced"
    : "default";
}
