/**
 * Anonymized Teachy-style output patterns for Gemini static context (patterns only).
 * Source: docs/teachy-benchmark/samples/ — benchmark theme Matemática 5º Frações.
 */

export const TEACHY_FEW_SHOT_BY_TYPE: Partial<Record<string, string>> = {
  lista: `
EXEMPLO TEACHY (lista — padrão visual, não copiar texto):
---
Matemática | 5º ano | Aluno(a): ______ | Data: ___/___/___

[Card 1] Maria comeu 2/8 de uma pizza e João comeu 3/8 da mesma pizza. Quanto da pizza eles comeram juntos?
a) 4/8  b) 5/8  c) 6/8  d) 7/8

[Card 2] Qual fração representa a parte pintada de um retângulo dividido em 6 partes iguais com 4 pintadas?
...

--- GABARITO ---
| # | Resposta |
| 1 | b) 5/8 |
| 2 | 4/6 ou 2/3 |
`.trim(),

  prova: `
EXEMPLO TEACHY (prova):
- Cabeçalho compacto (disciplina, série, aluno, data)
- 10 questões numeradas em cards, enunciado direto
- Gabarito em tabela separada, respostas de 1 linha
- Sem bloco "objetivos da avaliação" no corpo do aluno
`.trim(),

  slides: `
EXEMPLO TEACHY (slides):
Slide 1 (capa): Frações — 5º ano
Slide 2: O que é uma fração? (bullets: partes iguais, numerador, denominador)
Slide 3: Exemplo visual — pizza dividida em 8 partes
...
Notas de fala no painel do professor, não no slide visível ao aluno.
`.trim(),

  "plano-aula": `
EXEMPLO TEACHY (plano de aula):
Objetivos | Metodologia (introdução 10min, desenvolvimento 30min, fechamento 10min) | Recursos | Avaliação formativa
BNCC: EF05MA03 quando aplicável
`.trim(),

  jogo: `
EXEMPLO TEACHY (caça-palavras):
Grade 12×12 com termos: FRAÇÃO, NUMERADOR, DENOMINADOR, EQUIVALENTE...
Gabarito com coordenadas ou lista de palavras encontradas.
`.trim(),
};

export function buildTeachyFewShotBlock(type: string): string {
  const sample = TEACHY_FEW_SHOT_BY_TYPE[type];
  if (!sample) return "";
  return `
REFERÊNCIA DE PARIDADE TEACHY (${type}) — replique estrutura e densidade, gere conteúdo original:
${sample}
`.trim();
}
