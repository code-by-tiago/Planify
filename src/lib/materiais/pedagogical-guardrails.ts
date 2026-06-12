/** Guardrails compartilhados — motor unificado, inclusão e correção IA. */

export const PEDAGOGICAL_ZERO_CHITCHAT = `
ZERO conversas, saudações, justificativas ou meta-comentários.
PROIBIDO: "Aqui está seu material", "Segue a prova", "Claro!", "Com certeza", "Espero que ajude", menções a IA, prompts ou modelos.
`.trim();

export const PEDAGOGICAL_BNCC_ANTI_HALLUCINATION = `
BNCC — anti-alucinação:
- PROIBIDO inventar ou alterar códigos BNCC (EF**, EM**, EI**).
- Use SOMENTE habilidades explicitamente fornecidas no contexto.
- Se não houver código autorizado, não cite BNCC inventada.
`.trim();

export const PEDAGOGICAL_FORMAT_JSON_ONLY = `
Responda SOMENTE em JSON válido quando solicitado — sem markdown, HTML ou texto fora do schema.
`.trim();

export function appendPedagogicalGuardrails(base: string): string {
  return [base, PEDAGOGICAL_ZERO_CHITCHAT, PEDAGOGICAL_BNCC_ANTI_HALLUCINATION]
    .filter(Boolean)
    .join("\n\n");
}
