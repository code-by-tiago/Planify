/**
 * Contrato de exibição estruturada Planify — orienta o Gemini com padrões textuais
 * de alto nível (tabelas, cabeçalhos, bullets, notas, divisões de slide) mapeados
 * para campos JSON que o renderizador (material-engine-service + material-document-layout)
 * transforma em HTML elegante no iaplanify.com.br.
 *
 * REGRA: a API NÃO devolve markdown literal — só JSON estruturado.
 */

import type { MaterialEngineRequest, MaterialEngineResponse } from "./material-engine-types";

/** Padrões markdown/textuais proibidos em campos públicos (o renderer monta o layout). */
const MARKDOWN_ARTIFACT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /^#{1,6}\s/m, label: "cabeçalho markdown (#)" },
  { pattern: /```/, label: "bloco de código markdown" },
  { pattern: /^\s*>\s/m, label: "bloco de citação markdown (>)" },
  { pattern: /\|.+\|/, label: "tabela markdown (|)" },
  { pattern: /^\s*[-*+]\s/m, label: "lista markdown (- *)" },
  { pattern: /<[a-z][\s\S]*?>/i, label: "HTML embutido" },
];

const QUESTION_NUMBER_PREFIX = /^(?:quest[aã]o|exerc[ií]cio)\s*\d+\s*[.:)\-]/i;
const OPTION_LETTER_PREFIX = /^[A-Ea-e][).:\-]\s*/;
const MAX_GABARITO_CHARS = 120;

/**
 * Mapa conceitual padrão textual → campo JSON → componente de renderização.
 * Usado nos prompts para orientar o Gemini sem pedir markdown na resposta.
 */
export const DISPLAY_PATTERN_FIELD_MAP = `
MAPEAMENTO PADRÃO TEXTUAL → JSON → UI (Planify):
| Padrão textual (orientação)     | Campo JSON                          | Renderização na UI                    |
|---------------------------------|-------------------------------------|---------------------------------------|
| Cabeçalho institucional         | (automático via solicitação)        | planify-doc-meta-compact (tabela)     |
| Título da prova/material        | title                               | planify-doc-title (oculto em prova)   |
| Subtítulo / série               | subtitle                            | planify-doc-subtitle                  |
| Resumo de 1 linha               | summary                             | planify-doc-summary                   |
| Seção com título H2             | sections[].title                    | <h2> em planify-resumo-section        |
| Parágrafo de seção              | sections[].content                  | <p> sob o h2                          |
| Bullets indentados              | sections[].bullets[]                | <ul><li> em seção                     |
| Card de questão numerado        | exam.questions[].number             | planify-questao-number-badge          |
| Enunciado direto                | exam.questions[].statement          | planify-questao-statement             |
| Alternativas a) b) c) d)        | exam.questions[].options[]          | planify-questao-options (CSS ::before)|
| Linhas de resposta dissertativa | (options vazio)                     | planify-answer-lines                  |
| Gabarito tabela # | resposta    | exam.questions[].answer + answerKey | planify-gabarito-table (page-break)   |
| Nota pedagógica (> bloco)       | teacherNotes[]                      | lista "Notas para o professor"        |
| Destaque em slide               | slides[].callout {title,text}       | callout com borda lateral colorida    |
| Roteiro de fala                 | slides[].speakerNotes               | bloco "Notas do professor" no slide   |
| Divisão rígida de slide         | slides[] + layout + sequenceStep    | planify-slide cards empilhados        |
| Capa / fechamento               | slides[].layout capa|fechamento      | slide cover / síntese final           |
`.trim();

/** Contrato base de formato de exibição — compartilhado entre tipos. */
export const DISPLAY_FORMAT_CONTRACT = `
CONTRATO DE EXIBIÇÃO ESTRUTURADA (Planify — iaplanify.com.br):
- A resposta é SOMENTE JSON válido — PROIBIDO markdown, HTML, blocos \`\`\` ou tabelas literais em qualquer campo.
- O Planify renderiza automaticamente tabelas, cabeçalhos, bullets e cards a partir dos campos estruturados.
- Use os campos JSON corretos para cada elemento visual — nunca simule layout com texto formatado.

${DISPLAY_PATTERN_FIELD_MAP}

REGRAS DE OURO:
1. Cabeçalho compacto (disciplina, ano, aluno, data): NÃO preencher — o sistema injeta via solicitação.
2. Questões: array exam.questions[] — cada item com number, type, statement, options (se MC), answer (gabarito).
3. Alternativas: frases completas no array options SEM prefixo a) b) — o CSS adiciona as letras.
4. Gabarito: preencher answer em cada questão + answerKey no formato "Questão N: resposta" — o renderer monta tabela # | Resposta.
5. Bullets: sempre em arrays (sections[].bullets, slides[].bullets) — nunca "- item" em strings.
6. Notas pedagógicas (> bloco): teacherNotes[] ou slides[].callout — nunca ">" no texto público.
7. Slides: um objeto por slide com layout, title, bullets, speakerNotes, sequenceStep — divisões rígidas via array, não "---".
`.trim();

const PROVA_DISPLAY_RULES = `
FORMATO PROVA/LISTA (exibição elegante):
- title: nome curto da avaliação (ex.: "Prova de Matemática — Equações").
- summary: vazio ou 1 frase — o cabeçalho institucional já identifica o documento.
- exam.questions[]: única fonte de conteúdo do aluno — cards numerados renderizados automaticamente.
- statement: enunciado puro (1–3 frases) — SEM "Questão N:" no texto (o badge numérico é automático).
- options: exatamente 5 strings para múltipla escolha — sem a) b) nem markdown.
- answer + answerKey: respostas objetivas (máx. ${MAX_GABARITO_CHARS} chars) — tabela gabarito gerada pelo renderer.
- PROIBIDO: sections, activities, teacherNotes, html — versão do aluno é cabeçalho + questões + gabarito.
`.trim();

const SLIDES_DISPLAY_RULES = `
FORMATO SLIDES (divisões rígidas):
- slides[]: um objeto por slide — cada divisão "---" conceitual vira um elemento do array.
- layout: capa (1º) | conteudo | duasColunas | destaque | fechamento (último).
- sequenceStep + sequenceLabel: ordem pedagógica visível no header do slide.
- bullets[]: 3–5 itens curtos por slide — não parágrafos nem "- item" em string única.
- callout {title,text}: destaque pedagógico (equivalente a bloco ">") em 1–3 slides.
- speakerNotes: roteiro de fala do professor — não exibir ao aluno na exportação padrão.
`.trim();

const SECTIONS_DISPLAY_RULES = `
FORMATO SEÇÕES (resumo, apostila, sequência):
- sections[]: cada seção = H2 (title) + parágrafo opcional (content) + bullets[].
- bullets[]: itens sintéticos — o renderer monta <ul> com indentação visual.
- teacherNotes[]: notas pedagógicas do professor (equivalente a blocos ">") — fora da versão do aluno quando aplicável.
`.trim();

const TYPE_DISPLAY_RULES: Partial<Record<string, string>> = {
  prova: PROVA_DISPLAY_RULES,
  lista: PROVA_DISPLAY_RULES.replace(/Prova/g, "Lista").replace(
    "Prova de",
    "Lista de",
  ),
  slides: SLIDES_DISPLAY_RULES,
  resumo: SECTIONS_DISPLAY_RULES,
  apostila: SECTIONS_DISPLAY_RULES,
  sequencia: SECTIONS_DISPLAY_RULES,
  "plano-aula": SECTIONS_DISPLAY_RULES,
};

export function buildDisplayFormatContractForType(tipo: string): string {
  const specific = TYPE_DISPLAY_RULES[tipo];
  return specific
    ? `${DISPLAY_FORMAT_CONTRACT}\n\n${specific}`
    : DISPLAY_FORMAT_CONTRACT;
}

export function containsMarkdownArtifacts(text: string): string | null {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;

  for (const { pattern, label } of MARKDOWN_ARTIFACT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return label;
    }
  }
  return null;
}

export function hasQuestionNumberPrefix(text: string): boolean {
  return QUESTION_NUMBER_PREFIX.test(String(text || "").trim());
}

export function hasOptionLetterPrefixes(options: string[] | undefined): boolean {
  if (!Array.isArray(options)) return false;
  return options.some((opt) => OPTION_LETTER_PREFIX.test(String(opt || "").trim()));
}

export type DisplayFormatValidationContext = {
  tipo: string;
  incluirGabarito?: boolean;
};

/**
 * Valida que campos de texto não carregam markup — o renderer monta o layout.
 */
export function collectStructuredDisplayIssues(
  output: MaterialEngineResponse,
  ctx: DisplayFormatValidationContext,
): string[] {
  const issues: string[] = [];
  const tipo = ctx.tipo;

  const scanText = (label: string, text: string | undefined) => {
    const artifact = containsMarkdownArtifacts(text || "");
    if (artifact) {
      issues.push(`${label}: contém ${artifact} — use campos JSON estruturados.`);
    }
  };

  scanText("title", output.title);
  scanText("subtitle", output.subtitle);
  scanText("summary", output.summary);

  if (output.html?.trim()) {
    issues.push("html: não preencher — o Planify renderiza automaticamente.");
  }

  for (const [index, question] of (output.exam?.questions ?? []).entries()) {
    const n = index + 1;
    scanText(`Questão ${n} statement`, question.statement);

    if (hasQuestionNumberPrefix(question.statement || "")) {
      issues.push(
        `Questão ${n}: remova "Questão N:" do enunciado — o badge numérico é automático.`,
      );
    }

    if (hasOptionLetterPrefixes(question.options)) {
      issues.push(
        `Questão ${n}: alternativas com prefixo a) b) — envie só o texto no array options.`,
      );
    }

    for (const [optIndex, opt] of (question.options ?? []).entries()) {
      const artifact = containsMarkdownArtifacts(opt);
      if (artifact) {
        issues.push(
          `Questão ${n} alternativa ${optIndex + 1}: contém ${artifact}.`,
        );
      }
    }

    if (ctx.incluirGabarito && (question.answer?.trim().length ?? 0) > MAX_GABARITO_CHARS) {
      issues.push(
        `Questão ${n}: answer excede ${MAX_GABARITO_CHARS} caracteres — gabarito deve ser 1–2 linhas.`,
      );
    }

    if (ctx.incluirGabarito) {
      scanText(`Questão ${n} answer`, question.answer);
    }
  }

  for (const [index, line] of (output.answerKey ?? []).entries()) {
    const artifact = containsMarkdownArtifacts(line);
    if (artifact) {
      issues.push(`answerKey[${index + 1}]: contém ${artifact}.`);
    }
    if (/\|/.test(line)) {
      issues.push(
        `answerKey[${index + 1}]: não use tabela markdown — use "Questão N: resposta".`,
      );
    }
  }

  if (tipo === "prova" || tipo === "lista") {
    for (const [index, section] of (output.sections ?? []).entries()) {
      if (section.title?.trim() || section.content?.trim() || section.bullets?.length) {
        issues.push(
          `sections[${index + 1}]: prova/lista não usa seções — concentre em exam.questions.`,
        );
        break;
      }
    }
    if ((output.teacherNotes?.length ?? 0) > 0) {
      issues.push("teacherNotes: prova/lista do aluno não inclui notas do professor.");
    }
  }

  if (tipo === "slides") {
    for (const [index, slide] of (output.slides ?? []).entries()) {
      const n = index + 1;
      scanText(`Slide ${n} title`, slide.title);
      scanText(`Slide ${n} subtitle`, slide.subtitle);
      scanText(`Slide ${n} speakerNotes`, slide.speakerNotes);
      if (slide.callout?.text) scanText(`Slide ${n} callout`, slide.callout.text);
      for (const [bIndex, bullet] of (slide.bullets ?? []).entries()) {
        const artifact = containsMarkdownArtifacts(bullet);
        if (artifact) {
          issues.push(`Slide ${n} bullet ${bIndex + 1}: contém ${artifact}.`);
        }
      }
    }
  }

  return issues;
}

/** Contrato de exibição especializado para prova — exportado para prova-engine-contract. */
export function buildProvaDisplayFormatContract(
  _request?: Pick<MaterialEngineRequest, "incluirGabarito">,
): string {
  return buildDisplayFormatContractForType("prova");
}
