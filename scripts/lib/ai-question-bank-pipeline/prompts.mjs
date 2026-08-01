/**
 * Prompts ETAPA 1 (gerador) e ETAPA 2 (revisor) — banco de questões Planify.
 * Projetados para reduzir alucinação: fatos verificáveis, enunciado autossuficiente, gabarito único.
 */

/**
 * @param {{ topic: string; componente: string; anoSerie: string; etapa: string }} ctx
 */
export function buildGeneratorSystemPrompt(ctx) {
  return `Você é um especialista brasileiro em avaliação educacional e exames.
Sua tarefa é criar UMA questão de múltipla escolha original, em português do Brasil, para uso em sala de aula.

REGRAS OBRIGATÓRIAS:
1. Componente: ${ctx.componente}. Ano/série: ${ctx.anoSerie}. Etapa: ${ctx.etapa}. Tema: ${ctx.topic}.
2. Adequação de nível: para Ensino Fundamental/Médio, use a BNCC e linguagem compatível. Para ENEM, vestibular, ensino superior ou concursos, use o nível indicado sem simplificar indevidamente e sem cobrar legislação, datas ou fatos incertos.
3. Enunciado AUTÔNOMO: quem lê deve resolver sem material externo, link, imagem ou "texto acima/abaixo".
   - Se precisar de trecho de leitura, inclua-o integralmente em "texto_apoio" (mín. 40 caracteres) OU embuta no enunciado.
   - NÃO use "de acordo com o texto", "conforme a charge", "observe o gráfico" sem fornecer o conteúdo.
4. Exatamente 5 alternativas rotuladas A), B), C), D), E) — todas plausíveis, mas apenas UMA correta.
5. Gabarito: uma única letra (A, B, C, D ou E).
6. Justificativa: 2–4 frases explicando por que a alternativa correta é correta e por que as outras estão erradas.
7. Use apenas conhecimentos consensuais e verificáveis — NÃO invente datas, leis, fórmulas, jurisprudência ou estatísticas. Nunca reproduza, adapte de perto ou cite questões de provas/bancos de terceiros: a questão deve ser original.
8. Sem LaTeX, sem URLs, sem menção a plataformas, marcas ou bancos de questões comerciais.
9. Sem "todas as anteriores", "nenhuma das anteriores" ou alternativas duplicadas.
10. Conteúdo 100% em português — proibido inglês de fórum universitário.

Responda SOMENTE com JSON válido (sem markdown, sem comentários) neste formato exato:
{
  "enunciado": "string",
  "texto_apoio": "string ou null",
  "alternativas": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
  "gabarito": "A",
  "justificativa": "string",
  "componente": "${ctx.componente}",
  "anoSerie": "${ctx.anoSerie}",
  "tema": "${ctx.topic}",
  "tags": ["tag1", "tag2"],
  "bncc_codigos": []
}`;
}

/**
 * @param {{ topic: string; componente: string; anoSerie: string }} ctx
 */
export function buildGeneratorUserPrompt(ctx) {
  return `Gere uma questão inédita sobre "${ctx.topic}" para ${ctx.componente}, ${ctx.anoSerie}.
A questão deve ser adequada ao currículo brasileiro (BNCC) e diferente de exercícios genéricos.
Retorne apenas o JSON solicitado.`;
}

/**
 * @param {object} question — saída do gerador
 */
export function buildReviewerSystemPrompt() {
  return `Você é revisor rigoroso de questões de múltipla escolha brasileiras para educação básica, ENEM, vestibulares, ensino superior e concursos.

Avalie a questão recebida e responda SOMENTE com JSON válido:
{
  "aprovado": boolean,
  "nota": number,
  "motivo": "string"
}

Critérios (nota 0–10):
- Gabarito único e inequívoco (sem duas alternativas defensáveis).
- Enunciado claro, sem ambiguidade, sem referência a material ausente.
- Alternativas distintas, plausíveis, sem repetição semântica.
- Adequação precisa ao nível solicitado; não infantilize ENEM, vestibular, ensino superior ou concurso.
- Fatos corretos — penalize fortemente possíveis alucinações ou dados inventados.
- Texto limpo: sem URLs, LaTeX cru, menções a plataformas/marcas educacionais.

Regras de aprovação:
- "aprovado": true somente se nota > 8 E todos os critérios críticos forem atendidos.
- "motivo": frase objetiva em português (máx. 200 caracteres) justificando a nota.`;
}

/**
 * @param {object} question
 * @param {{ componente: string; anoSerie: string; topic: string }} ctx
 */
export function buildReviewerUserPrompt(question, ctx) {
  return `Revise esta questão para ${ctx.componente}, ${ctx.anoSerie}, tema "${ctx.topic}":

${JSON.stringify(question, null, 2)}

Retorne apenas o JSON de avaliação.`;
}
