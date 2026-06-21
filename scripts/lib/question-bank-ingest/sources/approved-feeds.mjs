/**
 * Conector de feeds de questões oficialmente autorizados ou licenciados.
 *
 * Não faz crawling genérico: só consome JSON HTTPS cadastrado pelo operador em
 * QUESTION_BANK_CURATED_FEEDS. Cada fonte precisa declarar licença e revisão
 * humana; sem esses metadados, nenhuma questão é publicada.
 */
import {
  bumpReject,
  bumpSource,
  normalizeWhitespace,
  validateQuestionCandidate,
} from "../shared.mjs";

export const SOURCE_ID = "approved-feeds";

const COLLECTIONS = new Set([
  "escolar",
  "enem",
  "vestibular",
  "concurso",
  "superior",
  "geral",
]);

function asString(value) {
  return String(value || "").trim();
}

function isSafeHttpsUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      host !== "localhost" &&
      host !== "127.0.0.1" &&
      host !== "::1" &&
      !host.endsWith(".local")
    );
  } catch {
    return false;
  }
}

/** Exportada para testes e para validar a configuração antes de automatizar. */
export function validateApprovedFeedDefinition(feed) {
  const id = asString(feed?.id);
  const name = asString(feed?.name);
  const url = asString(feed?.url);
  const license = asString(feed?.license);
  const collection = asString(feed?.collection || "geral").toLowerCase();
  const kind = asString(feed?.kind || "licensed").toLowerCase();

  if (!/^[a-z0-9][a-z0-9-]{1,63}$/i.test(id)) {
    return { ok: false, reason: "id_invalido" };
  }
  if (!name || !isSafeHttpsUrl(url)) return { ok: false, reason: "fonte_sem_https" };
  if (license.length < 3) return { ok: false, reason: "fonte_sem_licenca" };
  if (feed?.humanReviewed !== true) return { ok: false, reason: "fonte_sem_revisao_humana" };
  if (!COLLECTIONS.has(collection)) return { ok: false, reason: "colecao_invalida" };
  if (kind !== "official" && kind !== "licensed") return { ok: false, reason: "tipo_fonte_invalido" };

  return {
    ok: true,
    feed: {
      id,
      name,
      url,
      license,
      collection,
      kind,
      etapa: asString(feed?.etapa),
      anoSerie: asString(feed?.anoSerie || "Geral"),
      componente: asString(feed?.componente || "Multicomponente"),
      reviewedBy: asString(feed?.reviewedBy || name),
      maxItems: Math.min(2000, Math.max(1, Number(feed?.maxItems) || 500)),
    },
  };
}

function getConfiguredFeeds() {
  const raw = process.env.QUESTION_BANK_CURATED_FEEDS?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    throw new Error("QUESTION_BANK_CURATED_FEEDS precisa ser um JSON array válido.");
  }
}

function readQuestions(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.questions)) return payload.questions;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function normalizeAlternatives(raw) {
  const values = raw?.alternativas || raw?.alternatives || raw?.opcoes || raw?.options || [];
  return Array.isArray(values)
    ? values.map((value) => normalizeWhitespace(value)).filter(Boolean)
    : [];
}

function normalizeFeedQuestion(raw, feed) {
  const alternativas = normalizeAlternatives(raw);
  const tipo = asString(raw?.tipo || raw?.type || (alternativas.length >= 3 ? "objetiva" : "discursiva"));
  const sourceType = `ingest:${feed.kind}:${feed.id}`;

  return {
    enunciado: normalizeWhitespace(raw?.enunciado || raw?.statement || raw?.question),
    textoApoio: normalizeWhitespace(raw?.textoApoio || raw?.texto_apoio || raw?.supportingText) || undefined,
    tipo,
    alternativas,
    respostaEsperada: normalizeWhitespace(raw?.respostaEsperada || raw?.resposta_esperada || raw?.answer || raw?.gabarito),
    criterioCorrecao: normalizeWhitespace(raw?.criterioCorrecao || raw?.criterio_correcao || raw?.explanation || raw?.justificativa || raw?.answer || raw?.gabarito),
    componente: asString(raw?.componente || raw?.discipline || feed.componente),
    anoSerie: asString(raw?.anoSerie || raw?.ano_serie || feed.anoSerie),
    etapa: asString(raw?.etapa || feed.etapa),
    tema: asString(raw?.tema || raw?.topic || raw?.subject || "Questão curada"),
    bnccCodigos: Array.isArray(raw?.bnccCodigos || raw?.bncc_codigos)
      ? (raw.bnccCodigos || raw.bncc_codigos).map(asString).filter(Boolean).slice(0, 8)
      : [],
    tags: [
      ...(Array.isArray(raw?.tags) ? raw.tags.map(asString).filter(Boolean).slice(0, 8) : []),
      feed.collection,
      "fonte-curada",
    ],
    collection: asString(raw?.collection || feed.collection).toLowerCase(),
    sourceTitle: asString(raw?.sourceTitle || raw?.source_title || feed.name),
    sourceType,
    sourceUrl: asString(raw?.sourceUrl || raw?.source_url || feed.url),
    sourceLicense: feed.license,
    reviewStatus: "human-reviewed",
    reviewedAt: new Date().toISOString(),
    authorName: feed.reviewedBy,
  };
}

async function fetchFeedJson(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("json")) throw new Error("feed não retornou JSON");
  return response.json();
}

export async function* iterateApprovedFeeds(ctx) {
  let configured;
  try {
    configured = getConfiguredFeeds();
  } catch (error) {
    ctx.stats.errors += 1;
    ctx.log(
      `approved-feeds: configuração ignorada (${error instanceof Error ? error.message : "erro"}).`,
    );
    return;
  }
  if (!configured.length) {
    ctx.log("approved-feeds: nenhuma fonte licenciada configurada; pulando.");
    return;
  }

  for (const rawFeed of configured) {
    if (ctx.shouldAbort()) return;
    const definition = validateApprovedFeedDefinition(rawFeed);
    if (!definition.ok) {
      ctx.log(`approved-feeds: fonte ignorada (${definition.reason}).`);
      ctx.stats.errors += 1;
      continue;
    }

    const feed = definition.feed;
    let payload;
    try {
      payload = await fetchFeedJson(feed.url);
    } catch (error) {
      ctx.stats.errors += 1;
      ctx.log(`approved-feeds: ${feed.id} indisponível (${error instanceof Error ? error.message : "erro"}).`);
      continue;
    }

    const questions = readQuestions(payload).slice(0, feed.maxItems);
    for (const rawQuestion of questions) {
      if (ctx.shouldAbort()) return;
      ctx.stats.scanned += 1;
      bumpSource(ctx.stats, SOURCE_ID, "scanned");

      const candidate = normalizeFeedQuestion(rawQuestion, feed);
      const validation = validateQuestionCandidate(candidate);
      if (!validation.ok) {
        bumpReject(ctx.stats, validation.reason || "feed_invalido");
        bumpSource(ctx.stats, SOURCE_ID, "rejected");
        continue;
      }

      ctx.stats.accepted += 1;
      bumpSource(ctx.stats, SOURCE_ID, "accepted");
      yield candidate;
    }
  }
}
