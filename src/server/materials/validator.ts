/**
 * Validador de segurança de backend — intercepta resposta do Gemini Flash
 * ANTES de enviar ao usuário. Sanitiza, valida, rejeita vazamentos e agenda retry.
 */

import type {
  MaterialLayout,
  MaterialSecao,
  PromptEngineInput,
  QuestaoItem,
  TipoFerramenta,
  ValidationResult,
  ValidatorInterceptResult,
} from "./types";
import {
  isQuestoesConteudo,
  isSecaoTipo,
  isSlideConteudo,
  isTabelaConteudo,
  isTextoConteudo,
  isTipoFerramenta,
  SECAO_TIPO_VALUES,
  TIPO_FERRAMENTA_VALUES,
} from "./types";

// ---------------------------------------------------------------------------
// Padrões de vazamento / alucinação conversacional
// ---------------------------------------------------------------------------

const FORBIDDEN_CHITCHAT_PATTERNS = [
  /^aqui est[aá]/i,
  /^segue\s+(sua|a|o)/i,
  /^claro[,!]/i,
  /^com certeza/i,
  /^vou gerar/i,
  /^este material foi/i,
  /^abaixo est[aá]/i,
  /^conforme solicitado/i,
  /^espero que ajude/i,
  /^pronto[,!]/i,
  /^segue o material/i,
  /como\s+especialista/i,
  /como\s+ia\b/i,
  /intelig[eê]ncia artificial/i,
  /\bjson\b/i,
  /\bschema\b/i,
  /\bbastidor/i,
];

const BNCC_CODE_PATTERN = /\b(E[FI]|EM)\d{2}[A-Z]{2}\d{2,3}\b/gi;

const COUNT_TOLERANCE = 1;
const MAX_JUSTIFICATIVA_CHARS = 120;
const MAX_TOPICOS_POR_SLIDE = 4;
const MIN_ALTERNATIVAS = 5;
const LETRAS_VALIDAS = new Set(["A", "B", "C", "D", "E"]);

// ---------------------------------------------------------------------------
// Sanitização de string bruta do Gemini
// ---------------------------------------------------------------------------

/**
 * Remove caracteres inválidos, conversa fiada e extrai o primeiro objeto JSON.
 */
export function sanitizeGeminiRawText(raw: string): string {
  let text = String(raw || "").trim();

  // Remove BOM e caracteres de controle (exceto \n \r \t)
  text = text.replace(/^\uFEFF/, "");
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

  // Remove cercas markdown
  if (text.startsWith("```")) {
    text = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
  }

  // Extrai primeiro objeto JSON balanceado
  const firstBrace = text.indexOf("{");
  if (firstBrace < 0) return text;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = firstBrace; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(firstBrace, i + 1);
      }
    }
  }

  // Fallback: último }
  const lastBrace = text.lastIndexOf("}");
  if (lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  return text.slice(firstBrace);
}

export function containsForbiddenChitchat(text: string): boolean {
  const trimmed = String(text || "").trim();
  if (!trimmed) return false;
  return FORBIDDEN_CHITCHAT_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function scanTextForIssues(label: string, text: string | undefined): string[] {
  const issues: string[] = [];
  const trimmed = String(text || "").trim();
  if (!trimmed) return issues;

  if (containsForbiddenChitchat(trimmed)) {
    issues.push(`${label}: texto conversacional ou meta-comentário proibido.`);
  }
  if (/^#{1,6}\s/m.test(trimmed)) {
    issues.push(`${label}: contém cabeçalho markdown — use campos JSON estruturados.`);
  }
  if (/```/.test(trimmed)) {
    issues.push(`${label}: contém bloco de código markdown.`);
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Parse seguro
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMetadata(raw: unknown): MaterialLayout["metadata"] | null {
  if (!isRecord(raw)) return null;

  const tema = String(raw.tema ?? "").trim();
  const serie = String(raw.serie ?? "").trim();
  const habilidadeBNCC = String(raw.habilidadeBNCC ?? "").trim();
  const codigoBNCC = String(raw.codigoBNCC ?? "").trim();

  if (!tema || !serie) return null;

  return { tema, serie, habilidadeBNCC, codigoBNCC };
}

function parseSecao(raw: unknown): MaterialSecao | null {
  if (!isRecord(raw)) return null;

  const titulo = String(raw.titulo ?? "").trim();
  const tipo = String(raw.tipo ?? "").trim();

  if (!titulo || !isSecaoTipo(tipo)) return null;
  if (!isRecord(raw.conteudo)) return null;

  return {
    titulo,
    tipo,
    conteudo: raw.conteudo as MaterialSecao["conteudo"],
  };
}

export function parseMaterialLayout(raw: unknown): MaterialLayout | null {
  if (!isRecord(raw)) return null;

  const metadata = parseMetadata(raw.metadata);
  if (!metadata) return null;

  if (!Array.isArray(raw.secoes) || raw.secoes.length === 0) return null;

  const secoes: MaterialSecao[] = [];
  for (const item of raw.secoes) {
    const secao = parseSecao(item);
    if (!secao) return null;
    secoes.push(secao);
  }

  return { metadata, secoes };
}

export function tryParseMaterialLayoutFromRaw(raw: string): ValidationResult {
  const sanitized = sanitizeGeminiRawText(raw);

  if (containsForbiddenChitchat(sanitized)) {
    return {
      ok: false,
      issues: ["Resposta contém texto conversacional fora do JSON — rejeitada."],
      sanitizedRaw: sanitized,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(sanitized);
  } catch {
    return {
      ok: false,
      issues: ["JSON inválido ou incompleto após sanitização."],
      sanitizedRaw: sanitized,
    };
  }

  const layout = parseMaterialLayout(parsed);
  if (!layout) {
    return {
      ok: false,
      issues: ["Estrutura MaterialLayout incompleta — metadata ou secoes ausentes."],
      sanitizedRaw: sanitized,
    };
  }

  return { ok: true, layout };
}

// ---------------------------------------------------------------------------
// Validação pedagógica por ferramenta
// ---------------------------------------------------------------------------

function countQuestoes(layout: MaterialLayout): number {
  let total = 0;
  for (const secao of layout.secoes) {
    if (secao.tipo === "questoes" && isQuestoesConteudo(secao.conteudo, secao.tipo)) {
      total += secao.conteudo.questoes?.length ?? 0;
    }
  }
  return total;
}

function countSlides(layout: MaterialLayout): number {
  let total = 0;
  for (const secao of layout.secoes) {
    if (secao.tipo === "slide" && isSlideConteudo(secao.conteudo, secao.tipo)) {
      total += secao.conteudo.slides?.length ?? 0;
    }
  }
  return total;
}

function hasCronogramaTabela(layout: MaterialLayout): boolean {
  return layout.secoes.some((secao) => {
    if (secao.tipo !== "tabela" || !isTabelaConteudo(secao.conteudo, secao.tipo)) {
      return false;
    }
    const headers = secao.conteudo.cabecalhos ?? [];
    const headerText = headers.join(" ").toLowerCase();
    return (
      headerText.includes("etapa") ||
      headerText.includes("duração") ||
      headerText.includes("duracao") ||
      headerText.includes("atividade")
    );
  });
}

function validateQuestao(questao: QuestaoItem, index: number, incluirGabarito: boolean): string[] {
  const issues: string[] = [];
  const n = index + 1;

  issues.push(...scanTextForIssues(`Questão ${n} enunciado`, questao.enunciado));

  const alts = questao.alternativas ?? [];
  if (questao.tipo === "multipla-escolha" || alts.length > 0) {
    if (alts.length < MIN_ALTERNATIVAS) {
      issues.push(
        `Questão ${n}: múltipla escolha exige ${MIN_ALTERNATIVAS} alternativas (A–E).`,
      );
    }
    const letras = new Set(alts.map((a) => String(a.letra).toUpperCase()));
    for (const letra of ["A", "B", "C", "D", "E"] as const) {
      if (!letras.has(letra)) {
        issues.push(`Questão ${n}: falta alternativa ${letra}.`);
      }
    }
    for (const alt of alts) {
      if (!LETRAS_VALIDAS.has(String(alt.letra).toUpperCase())) {
        issues.push(`Questão ${n}: letra de alternativa inválida (${alt.letra}).`);
      }
      issues.push(...scanTextForIssues(`Questão ${n} alt ${alt.letra}`, alt.texto));
    }

    const resposta = String(questao.respostaCorreta || "").trim().toUpperCase();
    if (incluirGabarito && resposta && !LETRAS_VALIDAS.has(resposta)) {
      issues.push(`Questão ${n}: respostaCorreta deve ser A, B, C, D ou E.`);
    }
  }

  if (incluirGabarito) {
    const just = String(questao.justificativa || "").trim();
    if (!just) {
      issues.push(`Questão ${n}: justificativa obrigatória quando gabarito ativo.`);
    } else if (just.length > MAX_JUSTIFICATIVA_CHARS) {
      issues.push(
        `Questão ${n}: justificativa excede ${MAX_JUSTIFICATIVA_CHARS} caracteres.`,
      );
    }
    issues.push(...scanTextForIssues(`Questão ${n} justificativa`, just));
  }

  return issues;
}

function validateBnccCodes(
  layout: MaterialLayout,
  allowedCodes: Set<string>,
): string[] {
  const issues: string[] = [];
  const publicText = JSON.stringify(layout);
  const cited = [...new Set((publicText.match(BNCC_CODE_PATTERN) ?? []).map((c) => c.toUpperCase()))];

  if (!allowedCodes.size && cited.length > 0) {
    issues.push(
      `Códigos BNCC citados sem âncora confirmada: ${cited.join(", ")}.`,
    );
    return issues;
  }

  for (const code of cited) {
    if (!allowedCodes.has(code)) {
      issues.push(`Código BNCC não autorizado: ${code}.`);
    }
  }

  if (allowedCodes.size > 0 && layout.metadata.codigoBNCC) {
    const metaCode = layout.metadata.codigoBNCC.toUpperCase();
    if (!allowedCodes.has(metaCode)) {
      issues.push(`metadata.codigoBNCC (${metaCode}) não está na âncora RAG.`);
    }
  }

  return issues;
}

export function validateMaterialLayout(
  input: PromptEngineInput,
  layout: MaterialLayout,
): string[] {
  const issues: string[] = [];
  const tipo = input.tipoFerramenta;
  const q = input.quantidade;
  const incluirGabarito = input.incluirGabarito !== false;

  // Metadados
  issues.push(...scanTextForIssues("metadata.tema", layout.metadata.tema));
  if (layout.metadata.tema.toLowerCase() !== input.tema.trim().toLowerCase()) {
    // tolerância: tema deve estar presente (não precisa ser idêntico byte a byte)
    if (!layout.metadata.tema.toLowerCase().includes(input.tema.trim().toLowerCase().slice(0, 8))) {
      issues.push("metadata.tema diverge significativamente do tema solicitado.");
    }
  }

  const allowedBncc = new Set(
    (input.habilidadesBncc ?? [])
      .map((s) => String(s.codigo || "").trim().toUpperCase())
      .filter(Boolean),
  );
  issues.push(...validateBnccCodes(layout, allowedBncc));

  if (!layout.secoes.length) {
    issues.push("secoes: array vazio — material incompleto.");
    return [...new Set(issues)];
  }

  // Validação por seção
  for (const [index, secao] of layout.secoes.entries()) {
    const label = `secoes[${index + 1}]`;
    issues.push(...scanTextForIssues(`${label} titulo`, secao.titulo));

    if (!SECAO_TIPO_VALUES.includes(secao.tipo)) {
      issues.push(`${label}: tipo de seção inválido (${secao.tipo}).`);
      continue;
    }

    if (isTextoConteudo(secao.conteudo, secao.tipo)) {
      for (const p of secao.conteudo.paragrafos ?? []) {
        issues.push(...scanTextForIssues(`${label} parágrafo`, p));
      }
      for (const b of secao.conteudo.bullets ?? []) {
        issues.push(...scanTextForIssues(`${label} bullet`, b));
      }
    }

    if (isTabelaConteudo(secao.conteudo, secao.tipo)) {
      const cols = secao.conteudo.cabecalhos?.length ?? 0;
      if (cols === 0) {
        issues.push(`${label}: tabela sem cabecalhos.`);
      }
      for (const [rowIndex, row] of (secao.conteudo.linhas ?? []).entries()) {
        if (cols > 0 && row.length !== cols) {
          issues.push(
            `${label} linha ${rowIndex + 1}: ${row.length} colunas, esperado ${cols}.`,
          );
        }
        for (const cell of row) {
          issues.push(...scanTextForIssues(`${label} célula`, cell));
        }
      }
    }

    if (isQuestoesConteudo(secao.conteudo, secao.tipo)) {
      for (const [qi, questao] of (secao.conteudo.questoes ?? []).entries()) {
        issues.push(...validateQuestao(questao as QuestaoItem, qi, incluirGabarito));
      }
    }

    if (
      isSlideConteudo(secao.conteudo, secao.tipo) &&
      tipo !== "slides" &&
      tipo !== "aula-completa"
    ) {
      issues.push(
        `${label}: seções tipo slide não são permitidas em ${tipo} — use seções tipo texto.`,
      );
    }

    if (
      isSlideConteudo(secao.conteudo, secao.tipo) &&
      (tipo === "slides" || tipo === "aula-completa")
    ) {
      for (const [si, slide] of (secao.conteudo.slides ?? []).entries()) {
        issues.push(...scanTextForIssues(`Slide ${si + 1} titulo`, slide.titulo));
        const topicos = slide.topicos ?? [];
        if (topicos.length > MAX_TOPICOS_POR_SLIDE) {
          issues.push(
            `Slide ${si + 1}: máximo ${MAX_TOPICOS_POR_SLIDE} tópicos (recebido ${topicos.length}).`,
          );
        }
        if (topicos.length === 0) {
          issues.push(`Slide ${si + 1}: sem tópicos — slide vazio.`);
        }
        for (const topico of topicos) {
          issues.push(...scanTextForIssues(`Slide ${si + 1} tópico`, topico));
        }
      }
    }
  }

  // Regras por ferramenta
  if (tipo === "prova" || tipo === "lista") {
    const total = countQuestoes(layout);
    if (total === 0) {
      issues.push("Nenhuma questão gerada — seção tipo questoes obrigatória.");
    } else if (total < q - COUNT_TOLERANCE || total > q + COUNT_TOLERANCE) {
      issues.push(`Quantidade de questões: esperado ${q}, recebido ${total}.`);
    }
  }

  if (tipo === "slides") {
    const total = countSlides(layout);
    if (total === 0) {
      issues.push("Nenhum slide gerado — seção tipo slide obrigatória.");
    } else if (total < q - COUNT_TOLERANCE || total > q + COUNT_TOLERANCE) {
      issues.push(`Quantidade de slides: esperado ${q}, recebido ${total}.`);
    }
  }

  if (tipo === "plano-aula" || tipo === "aula-completa") {
    if (!hasCronogramaTabela(layout)) {
      issues.push(
        "Cronograma cronometrado obrigatório — inclua seção tipo tabela com Etapa/Duração/Atividade.",
      );
    }
  }

  if (tipo === "aula-completa") {
    const tiposPresentes = new Set(layout.secoes.map((s) => s.tipo));
    for (const required of ["tabela", "slide", "questoes"] as const) {
      if (!tiposPresentes.has(required)) {
        issues.push(`Aula completa: falta seção tipo "${required}".`);
      }
    }
  }

  return [...new Set(issues)].slice(0, 20);
}

// ---------------------------------------------------------------------------
// Middleware de interceptação (com retry em background)
// ---------------------------------------------------------------------------

export type RetryHandler = (context: {
  issues: string[];
  sanitizedRaw: string;
  input: PromptEngineInput;
}) => Promise<string | null>;

/**
 * Intercepta resposta bruta do Gemini ANTES de entregar ao usuário.
 * - Sanitiza e faz parse
 * - Rejeita vazamentos conversacionais
 * - Valida estrutura e regras pedagógicas
 * - Dispara retry rápido em background quando inválido
 */
export async function interceptAndValidateGeminiResponse(
  raw: string,
  input: PromptEngineInput,
  options?: {
    onRetry?: RetryHandler;
    maxSyncAttempts?: number;
  },
): Promise<ValidatorInterceptResult> {
  const maxAttempts = options?.maxSyncAttempts ?? 2;
  let currentRaw = raw;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const parsed = tryParseMaterialLayoutFromRaw(currentRaw);

    if (!parsed.ok) {
      if (attempt < maxAttempts) continue;
      return scheduleRetry(parsed.issues, parsed.sanitizedRaw ?? currentRaw, input, options?.onRetry);
    }

    const issues = validateMaterialLayout(input, parsed.layout);

    if (issues.length === 0) {
      return { accepted: true, layout: parsed.layout };
    }

    if (attempt < maxAttempts) continue;

    return scheduleRetry(issues, sanitizeGeminiRawText(currentRaw), input, options?.onRetry);
  }

  return scheduleRetry(
    ["Falha após tentativas de parse/validação."],
    sanitizeGeminiRawText(raw),
    input,
    options?.onRetry,
  );
}

async function scheduleRetry(
  issues: string[],
  sanitizedRaw: string,
  input: PromptEngineInput,
  onRetry?: RetryHandler,
): Promise<ValidatorInterceptResult> {
  let retryScheduled = false;

  if (onRetry) {
    // Dispara retry em background — não bloqueia o caller
    retryScheduled = true;
    void onRetry({ issues, sanitizedRaw, input }).catch(() => {
      /* retry silencioso — log pode ser adicionado pelo orchestrator */
    });
  }

  return {
    accepted: false,
    issues,
    retryScheduled,
    sanitizedRaw,
  };
}

// ---------------------------------------------------------------------------
// Helpers de integração com o motor legado
// ---------------------------------------------------------------------------

export function normalizeTipoFerramenta(value: string): TipoFerramenta | null {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  if (key === "slide") return "slides";
  if (key === "plano") return "plano-aula";
  if (key === "mapa mental") return "mapa-mental";
  if (key === "aula completa") return "aula-completa";
  if (key === "correcao") return "correcao-ia";

  return isTipoFerramenta(key) ? key : null;
}

export function assertKnownToolType(value: string): TipoFerramenta {
  const normalized = normalizeTipoFerramenta(value);
  if (!normalized) {
    throw new Error(
      `Tipo de ferramenta inválido: "${value}". Válidos: ${TIPO_FERRAMENTA_VALUES.join(", ")}`,
    );
  }
  return normalized;
}
