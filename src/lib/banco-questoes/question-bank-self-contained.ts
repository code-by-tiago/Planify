/**
 * Questão de banco deve ser autossuficiente — quem usa não tem o material original.
 */

const CONTEXT_REF_PATTERNS = [
  /de acordo com (?:o|a|os|as)\s+/i,
  /com base (?:no|na|em)\s+/i,
  /conforme (?:o|a|os|as)\s+/i,
  /segundo (?:o|a|os|as)\s+(?:texto|autor|narrador)/i,
  /(?:no|na|nos|nas)\s+(?:texto|trecho|leitura|passagem|charge|tirinha|história|narrativa|diálogo|poema|crônica|notícia|reportagem|gráfico|tabela|imagem|mapa|figura|cartaz|anúncio|propaganda)\b/i,
  /(?:o|a)\s+texto\s+(?:abaixo|acima|a seguir|anexo|seguinte)/i,
  /leia\s+(?:o|a)\s+(?:texto|trecho)/i,
  /observe\s+(?:o|a)\s+(?:gráfico|imagem|mapa|tabela|figura)/i,
  /analise\s+(?:o|a)\s+(?:texto|trecho)/i,
  /no\s+contexto\s+(?:apresentado|acima|abaixo)/i,
  /(?:acima|abaixo|anterior|seguinte)\s*,?\s*(?:responda|assinale|marque|explique)/i,
];

const PROPER_NAMES =
  /\b(?:Lucas|Ana|Pedro|Maria|João|Luísa|Carlos|Julia|Júlia|Mariana|Felipe|Bruno|Laura|Fulano|Ciclano|Beltrano|autor|narrador|personagem)\b/i;

function normalize(text: string): string {
  return String(text || "").replace(/\s+/g, " ").trim();
}

export function hasEmbeddedReadingContext(enunciado: string): boolean {
  const text = normalize(enunciado);
  if (text.length < 80) return false;

  if (/«[^»]{40,}»/.test(text)) return true;
  if (/[""][^""]{40,}[""]/.test(text)) return true;
  if (/texto para leitura\s*:/i.test(text) && text.length > 220) return true;
  if (/trecho\s*:/i.test(text) && text.length > 200) return true;

  const beforeQuestion = text.split(/\?\s*/)[0] || text;
  if (beforeQuestion.length >= 140 && !CONTEXT_REF_PATTERNS.some((p) => p.test(beforeQuestion))) {
    return true;
  }

  return false;
}

export function referencesExternalContext(enunciado: string): boolean {
  const text = normalize(enunciado);
  return CONTEXT_REF_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Junta texto de leitura ao enunciado quando a questão depende dele.
 */
export function attachReadingContext(
  question: string,
  readingText: string,
): string {
  const q = normalize(question);
  const reading = normalize(readingText);
  if (!q || !reading) return q;
  if (hasEmbeddedReadingContext(q)) return q;
  if (!referencesExternalContext(q) && !needsNamedContext(q)) return q;
  return `Texto para leitura:\n${reading}\n\n${q}`;
}

function needsNamedContext(enunciado: string): boolean {
  const text = normalize(enunciado);
  const interpretive =
    /\b(?:qual|quem|o que|por que|porque|explique|identifique|justifique|cite|relacione)\b/i.test(
      text,
    );
  return interpretive && PROPER_NAMES.test(text) && text.length < 130;
}

/** Separa enunciados legados com texto de leitura embutido. */
export function splitEmbeddedReadingText(enunciado: string): {
  enunciado: string;
  textoApoio?: string;
} {
  const text = String(enunciado || "").trim();
  const match = text.match(
    /^texto (?:para )?leitura\s*:\s*\n?([\s\S]+?)\n\n([\s\S]+)$/i,
  );
  if (match) {
    return {
      textoApoio: match[1].trim(),
      enunciado: match[2].trim(),
    };
  }
  return { enunciado: text };
}

export function isQuestionSelfContained(
  enunciado: string,
  textoApoio?: string,
): { ok: true } | { ok: false; reason: string } {
  const text = normalize(enunciado);
  if (!text) return { ok: false, reason: "vazio" };

  const apoio = normalize(textoApoio || "");
  if (apoio.length >= 40) return { ok: true };

  if (hasEmbeddedReadingContext(text)) return { ok: true };

  if (referencesExternalContext(text)) {
    return { ok: false, reason: "sem_contexto" };
  }

  if (needsNamedContext(text)) {
    return { ok: false, reason: "personagem_sem_texto" };
  }

  return { ok: true };
}
