/**
 * Filtro pós-revisor: limpeza de texto e bloqueio de menções a concorrentes.
 */

/** Marcas/plataformas educacionais — bloqueadas no texto publicado */
const COMPETITOR_PATTERNS = [
  /\bteachy\b/i,
  /\bqconcursos\b/i,
  /\bdescomplica\b/i,
  /\bme\s*salva\b/i,
  /\bstoodi\b/i,
  /\bproenem\b/i,
  /\bestrategia\s*concursos\b/i,
  /\bgran\s*cursos\b/i,
  /\balfacon\b/i,
  /\bpositivo\b\s*(?:on|online|questões)/i,
  /\bplataforma\s+(?:de\s+)?questões\b/i,
  /\bbanco\s+de\s+questões\s+(?:comercial|pago)\b/i,
];

/**
 * @param {string} text
 */
export function containsCompetitorMention(text) {
  const value = String(text || "");
  return COMPETITOR_PATTERNS.some((p) => p.test(value));
}

/**
 * Remove menções explícitas a concorrentes (substitui por vazio ou termo neutro).
 * @param {string} text
 */
export function stripCompetitorMentions(text) {
  let out = String(text || "");
  const replacements = [
    [/\bteachy\b/gi, ""],
    [/\bqconcursos\b/gi, ""],
    [/\bdescomplica\b/gi, ""],
    [/\bme\s*salva\b/gi, ""],
    [/\bstoodi\b/gi, ""],
    [/\bproenem\b/gi, ""],
    [/\bgran\s*cursos\b/gi, ""],
    [/\bestrategia\s*concursos\b/gi, ""],
    [/\balfacon\b/gi, ""],
  ];
  for (const [pattern, repl] of replacements) {
    out = out.replace(pattern, repl);
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

/**
 * @param {string} anoSerie
 */
export function deriveEtapa(anoSerie) {
  const s = String(anoSerie || "").toLowerCase();
  if (/em|médio|medio|1º\s*ano.*em|2º\s*ano.*em|3º\s*ano.*em/.test(s)) {
    return "Ensino Médio";
  }
  if (/[6-9]º|sexto|sétimo|setimo|oitavo|nono/.test(s)) {
    return "Ensino Fundamental II";
  }
  if (/[1-5]º|primeiro|segundo|terceiro|quarto|quinto|anos?\s*iniciais/.test(s)) {
    return "Ensino Fundamental I";
  }
  return "Ensino Fundamental";
}

const GABARITO_LETTERS = new Set(["A", "B", "C", "D", "E"]);

/**
 * Normaliza saída do gerador para formato interno Planify.
 * @param {object} raw
 * @param {{ topic: string; componente: string; anoSerie: string; etapa: string }} ctx
 */
export function normalizeGeneratedQuestion(raw, ctx) {
  const enunciado = stripCompetitorMentions(String(raw.enunciado || "").trim());
  const textoApoio = raw.texto_apoio
    ? stripCompetitorMentions(String(raw.texto_apoio).trim())
    : "";

  const alternativas = (raw.alternativas || [])
    .map((a) => stripCompetitorMentions(String(a).trim()))
    .filter((a) => a.length >= 2);

  const gabarito = String(raw.gabarito || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-E]/g, "")
    .slice(0, 1);

  const justificativa = stripCompetitorMentions(String(raw.justificativa || "").trim());

  return {
    enunciado,
    textoApoio: textoApoio || undefined,
    tipo: "objetiva",
    alternativas,
    respostaEsperada: gabarito,
    criterioCorrecao: justificativa,
    componente: ctx.componente,
    anoSerie: ctx.anoSerie,
    etapa: ctx.etapa,
    tema: ctx.topic,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String).filter(Boolean).slice(0, 8) : [],
    bnccCodigos: Array.isArray(raw.bncc_codigos)
      ? raw.bncc_codigos.map(String).filter(Boolean).slice(0, 6)
      : [],
    sourceType: "ingest:ai-gemini",
    sourceTitle: "Geração IA Planify",
    authorName: "Planify Curadoria OER",
  };
}

/**
 * Valida estrutura mínima antes do revisor.
 * @param {object} raw
 */
export function validateGeneratorShape(raw) {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "json_invalido" };
  if (!String(raw.enunciado || "").trim()) return { ok: false, reason: "sem_enunciado" };
  if (!Array.isArray(raw.alternativas) || raw.alternativas.length < 5) {
    return { ok: false, reason: "alternativas_insuficientes" };
  }
  const letter = String(raw.gabarito || "")
    .trim()
    .toUpperCase()
    .slice(0, 1);
  if (!GABARITO_LETTERS.has(letter)) return { ok: false, reason: "gabarito_invalido" };
  if (!String(raw.justificativa || "").trim()) return { ok: false, reason: "sem_justificativa" };
  return { ok: true };
}

/**
 * @param {object} review
 */
export function isReviewApproved(review) {
  const nota = Number(review?.nota);
  const aprovado = Boolean(review?.aprovado);
  return aprovado && Number.isFinite(nota) && nota > 8;
}
