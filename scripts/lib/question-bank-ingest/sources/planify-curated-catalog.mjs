/**
 * Fonte interna: catálogo curado que também abastece a UI local.
 *
 * Mantém o fallback do frontend e o banco real de produção alinhados.
 */
import {
  bumpReject,
  bumpSource,
  loadTsModule,
  normalizeWhitespace,
  validateQuestionCandidate,
} from "../shared.mjs";

export const SOURCE_ID = "planify-curated-catalog";

const { CURATED_QUESTION_BANK_ITEMS } = loadTsModule(
  "src/lib/banco-questoes/question-bank-curated-catalog.ts",
);

function normalizeCuratedItem(item) {
  return {
    enunciado: normalizeWhitespace(item.enunciado),
    textoApoio: normalizeWhitespace(item.textoApoio || "") || undefined,
    tipo: item.tipo || (item.alternativas?.length ? "objetiva" : "discursiva"),
    alternativas: Array.isArray(item.alternativas)
      ? item.alternativas.map((alt) => normalizeWhitespace(alt)).filter(Boolean)
      : [],
    respostaEsperada: normalizeWhitespace(item.respostaEsperada),
    criterioCorrecao: normalizeWhitespace(
      item.criterioCorrecao || item.respostaEsperada,
    ),
    componente: item.componente || "Multicomponente",
    anoSerie: item.anoSerie || "Geral",
    etapa: item.etapa || "",
    tema: item.tema || "Questão curada Planify",
    bnccCodigos: Array.isArray(item.bnccCodigos) ? item.bnccCodigos : [],
    tags: [
      ...new Set([
        ...(Array.isArray(item.tags) ? item.tags : []),
        "catalogo-planify",
        "curadoria",
      ]),
    ],
    collection: item.collection || "escolar",
    sourceTitle: item.sourceTitle || "Planify Catálogo Curado",
    sourceType: item.sourceType || "ingest:ai:planify-catalog",
    sourceUrl: item.sourceUrl || undefined,
    sourceLicense: item.sourceLicense || "Conteúdo original Planify",
    reviewStatus: item.reviewStatus || "automated",
    qualityScore:
      typeof item.qualityScore === "number" ? item.qualityScore : 8.8,
    reviewedAt: item.reviewedAt || new Date().toISOString(),
    authorName: item.authorName || "Planify Curadoria",
  };
}

export async function* iteratePlanifyCuratedCatalog(ctx) {
  const items = Array.isArray(CURATED_QUESTION_BANK_ITEMS)
    ? CURATED_QUESTION_BANK_ITEMS
    : [];

  ctx.log(`planify-curated-catalog: ${items.length} questão(ões) no catálogo local.`);

  for (const item of items) {
    if (ctx.shouldAbort()) return;

    ctx.stats.scanned += 1;
    bumpSource(ctx.stats, SOURCE_ID, "scanned");

    const candidate = normalizeCuratedItem(item);
    const validation = validateQuestionCandidate(candidate);
    if (!validation.ok) {
      bumpReject(ctx.stats, validation.reason);
      bumpSource(ctx.stats, SOURCE_ID, "rejected");
      continue;
    }

    ctx.stats.accepted += 1;
    bumpSource(ctx.stats, SOURCE_ID, "accepted");
    yield candidate;
  }
}
