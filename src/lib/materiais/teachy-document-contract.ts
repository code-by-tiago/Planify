/**
 * Shared Teachy-style document contract for Planify material generation.
 * Benchmark: minimal headers, direct statements, clean options, table gabarito.
 * Planify bar: Teachy parity + BNCC + reservatório didático + validação semântica.
 */

/** Planify quality bar — must exceed generic IA / Teachy-style fillers. */
export const PLANIFY_EXCELLENCE_BAR = `
BARA DE EXCELÊNCIA PLANIFY (acima do padrão Teachy):
- Cada enunciado cita subconceito concreto do tema — zero placeholders ("conteúdo estudado", "explique o conceito").
- Múltipla escolha: 4 alternativas plausíveis, uma correta, distintas — sem prefixo a) b) no JSON.
- Gabarito objetivo em 1–2 linhas; justificativa pedagógica só quando indispensável.
- Progressão didática: básico → intermediário → desafio (listas e provas com 3+ itens).
- Linguagem calibrada ao ano/série; vocabulário do componente curricular.
- Material pronto para sala: professor imprime, aplica e revisa pontualmente — não reescreve o todo.
`.trim();

/** Prompt block appended to every material type generation request. */
export const TEACHY_DIRECT_CONTRACT = `
CONTRATO TEACHY — FORMATO DE DOCUMENTO (obrigatório):
- Cabeçalho mínimo: componente curricular, ano/série, aluno(a), data — sem título H1 redundante em prova/lista.
- Enunciados diretos: 1 a 3 frases no máximo; comando claro + contexto mínimo; sem preâmbulos ("nesta atividade", "a seguir").
- Questões numeradas: badge numérico apenas — NÃO rotular tipo visível ao aluno (dissertativa, múltipla escolha etc.).
- Alternativas: 4 a 5 opções distintas no array JSON sem prefixo de letra (o layout adiciona a) b) c) d) automaticamente).
- Gabarito (quando solicitado): página separada em tabela (# | resposta); cada resposta em no máximo 1–2 linhas (até 120 caracteres).
- Versão do aluno: NÃO incluir teacherNotes, sections introdutórias nem parágrafos de resumo/contextualização longos.
- Linguagem adequada ao ano/série; zero placeholders genéricos; zero repetição de enunciados.
- Conteúdo pronto para aplicar — professor imprime e usa sem reescrita.
`.trim();

/** Type-specific Teachy refinements layered on top of the base contract. */
export const TEACHY_TYPE_HINTS: Record<string, string> = {
  prova:
    "Prova Teachy: cabeçalho compacto (disciplina, série, aluno, data) + questões em cards numerados + gabarito em página separada (tabela # | resposta). Enunciado direto, 1–3 frases. Sem rotular tipo de questão ao aluno.",
  lista:
    "Lista Teachy: mesmo layout da prova; fluxo pós-submit com quantidade 5/10/15/20; progressão fácil→desafio; gabarito com respostas de 1–2 linhas; zero bloco introdutório pedagógico.",
  resumo:
    "Resumo Teachy: síntese em bullets (máx. 12 palavras/item); seções temáticas curtas; sem parágrafos explicativos antes do conteúdo.",
  atividade:
    "Atividade Teachy: objetivo + passos numerados + materiais + tempo estimado; enunciado aplicável em sala; critérios objetivos.",
  "plano-aula":
    "Plano Teachy: objetivos, metodologia, recursos, avaliação e duração por etapa; BNCC citada quando aplicável; ações concretas por bloco temporal.",
  sequencia:
    "Sequência Teachy: 1 seção por aula (1–10 encontros); objetivos, conteúdos, atividades e avaliação formativa por encontro.",
  apostila:
    "Apostila Teachy: capítulos progressivos; explicação breve antes da prática; fixação ao final de cada bloco.",
  slides:
    "Slides Teachy: capa + desenvolvimento diagramado + fechamento; bullets 3–5 por slide; speakerNotes com roteiro de fala; imagens sugeridas por slide de conteúdo.",
  flashcards:
    "Flashcards Teachy: frente = pergunta/conceito; verso = resposta curta (1–2 linhas); sem texto extra.",
  redacao:
    "Redação Teachy: tema + textos motivadores numerados + comando de produção; critérios/rubrica em teacherNotes (fora da versão do aluno).",
  projeto:
    "Projeto Teachy: desafio, etapas com tarefas, cronograma, produto final e critérios de avaliação formativa.",
  jogo:
    "Jogo Teachy: formato explícito (caça-palavras, cruzadinha, bingo, memória); regras passo a passo + peças/termos do tema; visual recortável quando aplicável.",
  "mapa-mental":
    "Mapa mental Teachy: tema central + ramos com 2–5 subtópicos; hierarquia sintética; sem parágrafos longos.",
  inclusao:
    "Inclusão Teachy: adaptações objetivas por necessidade (TEA, TDAH, dislexia); mantém conteúdo-base com ajustes de linguagem, tempo e formato.",
  "aula-completa":
    "Aula Mágica Teachy: pacote coeso (plano, slides, resumo, lista, atividade, jogo, prova) com mesma narrativa e progressão.",
};

export function buildTeachyContractForType(tipo: string): string {
  const hint = TEACHY_TYPE_HINTS[tipo];
  const typeBlock = hint
    ? `${TEACHY_DIRECT_CONTRACT}\n\nREFINO DO TIPO (${tipo}):\n- ${hint}`
    : TEACHY_DIRECT_CONTRACT;
  return `${PLANIFY_EXCELLENCE_BAR}\n\n${typeBlock}`;
}

/** Quality checklist injected on depth retry (last attempt before failure). */
export const TEACHY_DEPTH_CHECKLIST = [
  "MODO TEACHY — CHECKLIST DE PROFUNDIDADE (última tentativa):",
  "- Material direto: questões/exercícios numerados sem preâmbulos pedagógicos longos.",
  "- Cada enunciado cita subconceito concreto do tema (zero placeholders genéricos).",
  "- Enunciados com no máximo 3 frases; alternativas a) b) c) d) limpas e distintas.",
  "- Progressão: básico → intermediário → desafio.",
  "- Gabarito em tabela separada: resposta objetiva em 1–2 linhas (sem comentário pedagógico extenso).",
  "- Versão aluno: sem teacherNotes, sections introdutórias nem summary longo.",
  "- Vocabulário e complexidade compatíveis com ano/série informados.",
  "- Quantidade e formato exatos do contrato (questões, slides, cards, seções).",
  "- Zero repetição de parágrafos ou enunciados equivalentes.",
].join("\n");

/** Static quality rules string for cache/static prompt blocks. */
export const TEACHY_QUALITY_RULES = TEACHY_DEPTH_CHECKLIST;
