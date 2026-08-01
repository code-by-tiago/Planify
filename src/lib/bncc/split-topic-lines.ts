function normalizeConteudosText(value: string): string {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

/** Desfaz colagens comuns (espaços duplos, tabs, listas na mesma linha). */
function preprocessMessyConteudosText(value: string): string {
  let text = normalizeConteudosText(value);
  if (!text) {
    return "";
  }

  text = text.replace(/\t+/g, "\n");
  text = text.replace(/\s*[|／/]\s*/g, "\n");

  const dashSeparators = text.match(/\s+[-–—]\s+/g) || [];
  if (dashSeparators.length >= 2) {
    text = text.replace(/\s+[-–—]\s+/g, "\n");
  }

  text = text.replace(/ {2,}/g, "\n");
  text = text.replace(/(?<=\S)\s+(?=\d+[\.\)\-:]\s+\S)/g, "\n");
  text = text.replace(/(?<=\S)\s+(?=[\u2022\u00b7•]\s*)/g, "\n");

  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function cleanTopicLine(line: string): string {
  return line
    .replace(/^\s*[\u2022\u00b7•*>\-–—]+\s*/u, "")
    .replace(/^\s*\d+[\.\)\-:]\s*/u, "")
    .replace(/^\s*Ex\.?\s*:?\s*/iu, "")
    .trim();
}

function splitSingleLineTopics(line: string): string[] {
  return line
    .split(/;|\s·\s|,/u)
    .map((item) => cleanTopicLine(item))
    .filter(Boolean);
}

function splitMultilineTopic(line: string): string[] {
  const cleaned = cleanTopicLine(line);
  if (!cleaned) {
    return [];
  }

  // Em linha própria, vírgulas internas permanecem no tópico (regra BNCC).
  if (/;|\s·\s/u.test(cleaned)) {
    return cleaned
      .split(/;|\s·\s/u)
      .map((item) => cleanTopicLine(item))
      .filter(Boolean);
  }

  return [cleaned];
}

/**
 * Separa tópicos/conteúdos — alinhado ao motor BNCC (splitContents):
 * com quebras de linha divide só por linha; sem quebras usa ; · ou vírgula.
 */
export function splitTopicLines(value: string): string[] {
  const text = preprocessMessyConteudosText(value);

  if (!text) {
    return [];
  }

  if (/\n/.test(text)) {
    return text
      .split(/\n+/)
      .flatMap((line) => splitMultilineTopic(line))
      .filter(Boolean);
  }

  return splitSingleLineTopics(text);
}

/** Reorganiza o campo em um tópico por linha, pronto para BNCC e planejamento. */
export function normalizeConteudosFieldText(value: string): string {
  return splitTopicLines(value).join("\n");
}

function conteudosTopicsChanged(before: string, after: string): boolean {
  const left = splitTopicLines(before);
  const right = splitTopicLines(after);

  if (left.length !== right.length) {
    return true;
  }

  return left.some((topic, index) => topic !== right[index]);
}

/** Indica se o texto ainda precisa ser normalizado (ex.: colagem misturada). */
export function conteudosFieldNeedsNormalization(value: string): boolean {
  const current = normalizeConteudosText(value);
  if (!current) {
    return false;
  }

  const normalized = normalizeConteudosFieldText(value);
  return normalized !== current;
}

/** Indica se a normalização altera os tópicos (não só espaços/linhas em branco). */
export function conteudosTopicsWouldChange(value: string): boolean {
  if (!normalizeConteudosText(value)) {
    return false;
  }

  return conteudosTopicsChanged(value, normalizeConteudosFieldText(value));
}
