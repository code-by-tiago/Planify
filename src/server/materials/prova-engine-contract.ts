import {
  collectQuestionSemanticIssues,
  isGenericEducationalText,
} from "@/lib/materiais/material-semantic-quality";
import type {
  MaterialEngineRequest,
  MaterialEngineResponse,
} from "./material-engine-types";
import {
  buildProvaDisplayFormatContract,
  collectStructuredDisplayIssues,
} from "./structured-display-contract";

/** Contrato de exibição elegante — mapeia padrões textuais a campos JSON do renderer. */
export const DISPLAY_FORMAT_CONTRACT = buildProvaDisplayFormatContract();

/** Padrão de código BNCC oficial (EF/EM/EI). */
const BNCC_CODE_PATTERN = /\b(E[FI]|EM)\d{2}[A-Z]{2}\d{2,3}\b/gi;

/** Frases de conversa fiada / meta-comentário proibidas na saída pública. */
const PROVA_FORBIDDEN_CHITCHAT = [
  /^aqui est[aá]/i,
  /^segue\s+(sua|a)\s+prova/i,
  /^claro[,!]/i,
  /^com certeza/i,
  /^vou gerar/i,
  /^este material foi/i,
  /^abaixo est[aá]/i,
  /^conforme solicitado/i,
  /^espero que ajude/i,
  /como\s+especialista/i,
  /como\s+ia\b/i,
  /intelig[eê]ncia artificial/i,
  /\bjson\b/i,
  /\bschema\b/i,
  /\bbastidor/i,
];

const COUNT_TOLERANCE = 1;
const MAX_SUMMARY_CHARS = 120;
const MIN_MC_OPTIONS = 5;
const MAX_STATEMENT_CHARS = 320;

function countStatementSentences(text: string): number {
  return text
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 2).length;
}

export type ProvaBnccSkillAnchor = {
  codigo: string;
  descricao: string;
  conteudo?: string;
};

export function buildProvaEngineSystemInstruction(): string {
  return [
    "PAPEL: Especialista Pedagógico Sênior em Avaliação Escolar alinhado à BNCC (Brasil).",
    "MISSÃO: Produzir provas prontas para aplicação em sala — enunciados contextualizados, sem texto de apresentação.",
    "FORMATO DE SAÍDA: exclusivamente JSON válido conforme o schema fornecido pelo sistema.",
    "PROIBIDO: markdown, blocos ``` , comentários, prefácios ('Aqui está sua prova'), explicações sobre o processo de geração.",
    "PROIBIDO: inventar códigos BNCC — use somente os códigos literalmente fornecidos na âncora de dados.",
    "PROIBIDO: preencher 'html', 'sections', 'activities' ou 'teacherNotes' — a prova do aluno é cabeçalho + questões (+ gabarito separado).",
    "EXIBIÇÃO: o Planify renderiza cabeçalho, cards numerados e tabela de gabarito automaticamente — preencha apenas os campos JSON estruturados.",
    "OBRIGATÓRIO: cada questão deve aplicar o TEMA e a SÉRIE informados; linguagem adequada ao ano/série.",
    "Rejeite mentalmente qualquer saída genérica antes de responder.",
  ].join("\n");
}

export function buildProvaBnccRagAnchor(
  skills: ProvaBnccSkillAnchor[] | undefined,
): string {
  if (!skills?.length) {
    return `
ÂNCORA BNCC (ausente):
- Nenhuma habilidade foi confirmada pelo professor nesta solicitação.
- PROIBIDO inventar ou citar códigos BNCC (EF**, EM**, EI**) em title, subtitle, summary ou enunciados.
- Foque exclusivamente no TEMA, COMPONENTE e SÉRIE informados.`.trim();
  }

  const lines = skills
    .map((skill) => {
      const codigo = String(skill.codigo || "").trim().toUpperCase();
      const descricao = String(skill.descricao || "").trim();
      const conteudo = String(skill.conteudo || "").trim();
      return [
        `CÓDIGO_LITERAL: ${codigo}`,
        `DESCRIÇÃO_LITERAL: ${descricao}`,
        conteudo ? `CONTEÚDO_LITERAL: ${conteudo}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return `
ÂNCORA BNCC — DADOS OFICIAIS (RAG). USE APENAS ESTES REGISTROS; NÃO INVENTE OUTROS CÓDIGOS:
${lines}

REGRAS DA ÂNCORA:
- As questões devem avaliar competências compatíveis com as DESCRIÇÕES_LITERAL acima, sem trocar o tema principal.
- Se citar BNCC no material, use somente os CÓDIGO_LITERAL listados — copie exatamente, sem alterar dígitos ou letras.
- Não parafraseie a BNCC como texto introdutório; incorpore a competência nos enunciados e contextos das questões.`.trim();
}

export function buildProvaEngineGuardrails(request: MaterialEngineRequest): string {
  const q = request.quantidade;
  const gabarito = request.incluirGabarito ? "sim" : "não";

  return `
GUARDRAILS DE SAÍDA (PROVA):
- Gerar exatamente ${q} questões em exam.questions, numeradas a partir de 1.
- TEMA ÂNCORA (obrigatório em cada enunciado): "${request.tema}"
- ETAPA ÂNCORA: ${request.etapa}
- SÉRIE ÂNCORA: ${request.anoSerie}
- COMPONENTE ÂNCORA: ${request.componenteCurricular}
- DIFICULDADE: ${request.dificuldade}
- GABARITO: ${gabarito}
- summary: vazio ou no máximo 1 frase curta (título da avaliação) — máx. ${MAX_SUMMARY_CHARS} caracteres.
- title: nome da prova (ex.: "Prova de ${request.componenteCurricular} — ${request.tema}") — sem prefácio conversacional.
- exam.questions[].statement: enunciado direto, sem "Questão N:" no texto, sem "nesta prova", sem "a seguir".
- Múltipla escolha: exatamente ${MIN_MC_OPTIONS} alternativas em options, frases completas, sem prefixo a) b).
- Variar tipos (objetiva + dissertativa quando q >= 2).
- ZERO texto fora do JSON na resposta da API.`.trim();
}

export function buildProvaEngineSpecializedRules(
  request: MaterialEngineRequest,
): string[] {
  const q = request.quantidade;
  return [
    `Gerar exatamente ${q} questões no array 'exam.questions'.`,
    `TEMA OBRIGATÓRIO: cada enunciado deve trabalhar explicitamente "${request.tema}" com situações, frases ou contextos reais.`,
    "MATERIAL DIRETO: prova pronta para aplicar — sem textos introdutórios longos, sem explicações pedagógicas no corpo.",
    `Deixe 'summary' vazio ou com no máximo 1 frase curta (máx. ${MAX_SUMMARY_CHARS} caracteres).`,
    "Não preencha 'sections', 'activities', 'teacherNotes' nem 'html'.",
    "Numerar as questões em ordem ('number' começando em 1).",
    "Incluir pelo menos uma objetiva e uma dissertativa quando houver 2 ou mais questões.",
    "Proibir enunciados genéricos ('explique o conteúdo estudado', 'identifique o conceito').",
    "Enunciados diretos: comando + contexto mínimo — sem preâmbulos.",
    `Múltipla escolha: 'options' com exatamente ${MIN_MC_OPTIONS} alternativas distintas (mín. 35 caracteres cada).`,
    request.incluirGabarito
      ? "GABARITO ENXUTO: 'answer' em até 120 caracteres; 'answerKey' no formato 'Questão N: resposta'."
      : "Deixar 'answer' vazio e não preencher 'answerKey'.",
  ];
}

export function buildProvaEnginePromptExtension(
  request: MaterialEngineRequest,
): string {
  const rules = buildProvaEngineSpecializedRules(request)
    .map((rule) => `- ${rule}`)
    .join("\n");

  return `
MODO: GERADOR DE PROVA (contrato rígido Planify)

${buildProvaBnccRagAnchor(request.habilidadesSelecionadas)}

${buildProvaDisplayFormatContract(request)}

${buildProvaEngineGuardrails(request)}

REGRAS ESPECIALIZADAS DA PROVA:
${rules}
`.trim();
}

function containsForbiddenChitchat(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return PROVA_FORBIDDEN_CHITCHAT.some((pattern) => pattern.test(trimmed));
}

function extractBnccCodesFromText(text: string): string[] {
  const matches = text.match(BNCC_CODE_PATTERN) ?? [];
  return [...new Set(matches.map((code) => code.toUpperCase()))];
}

function allowedBnccCodes(skills: ProvaBnccSkillAnchor[] | undefined): Set<string> {
  return new Set(
    (skills ?? [])
      .map((skill) => String(skill.codigo || "").trim().toUpperCase())
      .filter(Boolean),
  );
}

/**
 * Sanitiza texto bruto do Gemini antes do parse JSON (quando responseSchema falhar ou em testes).
 * Remove conversa fiada e extrai o primeiro objeto JSON.
 */
export function sanitizeProvaGeminiRawText(raw: string): string {
  let text = String(raw || "").trim();

  if (text.startsWith("```")) {
    text = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  return text;
}

function countIssues(label: string, expected: number, actual: number): string | null {
  if (actual === 0) {
    return `${label}: nenhum item foi gerado (esperado ${expected}).`;
  }
  if (actual < expected - COUNT_TOLERANCE || actual > expected + COUNT_TOLERANCE) {
    return `${label}: esperado ${expected}, recebido ${actual}.`;
  }
  return null;
}

/**
 * Validação sintática e pedagógica da saída da Prova antes de persistir/exibir.
 */
export function validateProvaEngineOutput(
  request: MaterialEngineRequest,
  output: MaterialEngineResponse,
): string[] {
  const issues: string[] = [];
  const q = request.quantidade;
  const allowedBncc = allowedBnccCodes(request.habilidadesSelecionadas);

  const summary = output.summary?.trim() || "";
  if (containsForbiddenChitchat(output.title)) {
    issues.push("title contém texto conversacional — use apenas o nome da prova.");
  }
  if (containsForbiddenChitchat(summary)) {
    issues.push("summary contém texto conversacional — deixe vazio ou 1 frase curta.");
  }
  if (summary.length > MAX_SUMMARY_CHARS) {
    issues.push(
      `summary excede ${MAX_SUMMARY_CHARS} caracteres — remova contextualização longa.`,
    );
  }
  if (summary && isGenericEducationalText(summary)) {
    issues.push("summary genérico — use título específico ou deixe vazio.");
  }

  if ((output.sections?.length ?? 0) > 0) {
    issues.push("Prova: não use 'sections' — concentre tudo em exam.questions.");
  }
  if ((output.teacherNotes?.length ?? 0) > 0) {
    issues.push("Prova: não preencha 'teacherNotes'.");
  }
  if ((output.activities?.length ?? 0) > 0) {
    issues.push("Prova: não preencha 'activities'.");
  }
  if (output.html?.trim()) {
    issues.push("Prova: não preencha 'html' — o Planify renderiza automaticamente.");
  }

  const questions = output.exam?.questions ?? [];
  const countIssue = countIssues("questões", q, questions.length);
  if (countIssue) issues.push(countIssue);

  const publicText = [
    output.title,
    output.subtitle,
    output.summary,
    ...questions.map((item) => item.statement),
    ...(output.answerKey ?? []),
  ].join("\n");

  const citedCodes = extractBnccCodesFromText(publicText);
  if (!allowedBncc.size && citedCodes.length > 0) {
    issues.push(
      `Códigos BNCC citados sem âncora confirmada: ${citedCodes.join(", ")} — remova ou peça habilidades ao professor.`,
    );
  } else {
    for (const code of citedCodes) {
      if (!allowedBncc.has(code)) {
        issues.push(
          `Código BNCC inventado ou não autorizado: ${code} — use somente ${[...allowedBncc].join(", ")}.`,
        );
      }
    }
  }

  let hasObjective = false;
  let hasDiscursive = false;

  for (const displayIssue of collectStructuredDisplayIssues(output, {
    tipo: "prova",
    incluirGabarito: request.incluirGabarito,
  })) {
    issues.push(displayIssue);
  }

  for (const [index, question] of questions.entries()) {
    const statement = question.statement?.trim() || "";
    if (containsForbiddenChitchat(statement)) {
      issues.push(`Questão ${index + 1}: enunciado com texto conversacional ou meta-explicação.`);
    }

    const type = String(question.type || "").toLowerCase();
    if (type.includes("multipla") || type.includes("verdadeiro")) hasObjective = true;
    if (type.includes("dissert") || type.includes("discurs")) hasDiscursive = true;

    if (
      type.includes("multipla") &&
      (question.options?.length ?? 0) < MIN_MC_OPTIONS
    ) {
      issues.push(
        `Questão ${index + 1}: múltipla escolha exige ${MIN_MC_OPTIONS} alternativas.`,
      );
    }

    if (statement.length > MAX_STATEMENT_CHARS) {
      issues.push(`Questão ${index + 1}: enunciado longo demais (máx. 3 frases curtas).`);
    } else if (countStatementSentences(statement) > 3) {
      issues.push(`Questão ${index + 1}: limite de 3 frases no enunciado.`);
    }

    for (const semantic of collectQuestionSemanticIssues({
      statement: question.statement || "",
      answer: question.answer,
      options: question.options,
      tema: request.tema,
      questionType: question.type,
    }).slice(0, 2)) {
      issues.push(`Questão ${index + 1}: ${semantic}`);
    }

    if (issues.length >= 14) break;
  }

  if (q >= 2 && questions.length >= 2 && (!hasObjective || !hasDiscursive)) {
    issues.push(
      "Prova: inclua pelo menos uma questão objetiva e uma dissertativa.",
    );
  }

  return [...new Set(issues)];
}
