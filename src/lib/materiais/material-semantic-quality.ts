import { isWeakTeacherAnswer } from "./material-pedagogical-reference-kernel";

const GENERIC_PHRASES = [
  /conte[uú]do estudado/i,
  /tema estudado/i,
  /explique o conceito\b/i,
  /identifique o conceito sobre/i,
  /conforme o conte[uú]do/i,
  /a seguir apresentamos/i,
  /neste material\b/i,
  /de acordo com o tema/i,
  /sobre o assunto estudado/i,
  /resposta pessoal/i,
  /a crit[eé]rio do professor/i,
];

const PREAMBLE_PHRASES = [
  /^a seguir/i,
  /^nesta atividade/i,
  /^nesta prova/i,
  /^o professor dever[aá]/i,
  /^leia atentamente o texto abaixo e responda/i,
];

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

function significantThemeTokens(tema: string): string[] {
  const stop = new Set([
    "de",
    "da",
    "do",
    "das",
    "dos",
    "e",
    "em",
    "a",
    "o",
    "as",
    "os",
    "para",
    "por",
    "com",
    "no",
    "na",
    "um",
    "uma",
  ]);

  return normalize(tema)
    .split(" ")
    .filter((word) => word.length >= 4 && !stop.has(word));
}

export function isGenericEducationalText(text: unknown): boolean {
  const value = String(text || "").trim();
  if (!value || value.length < 24) return true;
  return GENERIC_PHRASES.some((pattern) => pattern.test(value));
}

export function hasPreambleStatement(text: unknown): boolean {
  const value = String(text || "").trim();
  if (!value) return false;
  return PREAMBLE_PHRASES.some((pattern) => pattern.test(value));
}

export function themeReferencedInText(text: unknown, tema: string): boolean {
  const normalizedText = normalize(text);
  const normalizedTheme = normalize(tema);
  if (!normalizedText || !normalizedTheme) return false;

  if (normalizedText.includes(normalizedTheme)) return true;

  const tokens = significantThemeTokens(tema);
  if (!tokens.length) {
    return normalizedTheme.length >= 4 && normalizedText.includes(normalizedTheme);
  }

  return tokens.some((token) => {
    if (normalizedText.includes(token)) return true;
    // Plural/singular PT-BR (ex.: equações ↔ equação)
    if (token.endsWith("oes") && normalizedText.includes(`${token.slice(0, -2)}ao`)) {
      return true;
    }
    if (token.endsWith("ao") && normalizedText.includes(`${token.slice(0, -2)}oes`)) {
      return true;
    }
    if (token.endsWith("s") && token.length > 4 && normalizedText.includes(token.slice(0, -1))) {
      return true;
    }
    return false;
  });
}

export function hasPackedSubquestions(text: unknown): boolean {
  const value = String(text || "");
  const questionMarks = (value.match(/\?/g) || []).length;
  if (questionMarks >= 2) return true;

  const enumerated = (value.match(/\b[abc]\)|\b[123]\)|\bI[\s.)-]/gi) || []).length;
  return enumerated >= 3 && value.length > 180;
}

export function hasDuplicateOptions(options: string[]): boolean {
  const normalized = options
    .map((item) => normalize(item))
    .filter((item) => item.length > 0);
  return new Set(normalized).size !== normalized.length;
}

export function weakOptions(options: string[]): boolean {
  const clean = options.map((item) => String(item || "").trim()).filter(Boolean);
  if (clean.length < 2) return false;
  return clean.some((item) => item.length < 3 || isGenericEducationalText(item));
}

export function collectQuestionSemanticIssues(params: {
  statement: string;
  answer?: string;
  options?: string[];
  tema: string;
  requireTheme?: boolean;
}): string[] {
  const issues: string[] = [];
  const statement = String(params.statement || "").trim();

  if (!statement || statement.length < 30) {
    issues.push("Enunciado muito curto ou vazio.");
  }
  if (isGenericEducationalText(statement)) {
    issues.push(`Enunciado genérico: "${statement.slice(0, 72)}..."`);
  }
  if (hasPreambleStatement(statement)) {
    issues.push("Enunciado começa com preâmbulo em vez de comando direto.");
  }
  if (hasPackedSubquestions(statement)) {
    issues.push("Enunciado concentra várias subquestões — separe em itens distintos.");
  }
  if (params.requireTheme !== false && !themeReferencedInText(statement, params.tema)) {
    issues.push(`Enunciado não referencia o tema "${params.tema}".`);
  }

  const options = params.options ?? [];
  if (options.length > 0) {
    if (hasDuplicateOptions(options)) {
      issues.push("Alternativas repetidas ou muito parecidas.");
    }
    if (weakOptions(options)) {
      issues.push("Alternativas fracas ou genéricas.");
    }
  }

  const answer = params.answer?.trim();
  if (answer && isWeakTeacherAnswer(answer)) {
    issues.push("Gabarito/resposta esperada vago ou genérico.");
  }

  return issues;
}

export function collectSectionSemanticIssues(params: {
  title: string;
  content: string;
  tema: string;
}): string[] {
  const issues: string[] = [];
  const title = String(params.title || "").trim();
  const content = String(params.content || "").trim();

  if (!title || title.length < 4) {
    issues.push("Seção sem título adequado.");
  }
  if (!content || content.length < 40) {
    issues.push(`Seção "${title || "sem título"}" com conteúdo insuficiente.`);
  }
  if (content && isGenericEducationalText(content) && content.length < 120) {
    issues.push(`Seção "${title}" com texto genérico.`);
  }
  if (content && !themeReferencedInText(`${title} ${content}`, params.tema)) {
    issues.push(`Seção "${title}" pouco relacionada ao tema "${params.tema}".`);
  }

  return issues;
}
