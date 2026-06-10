/**
 * Seed de temas transversais no cache pedagógico (curadoria aprovada para demo).
 * Run: npm run seed:pedagogical-themes
 *
 * Requer NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * Busca resumo na Wikipédia PT e insere como approved (lista curada apenas).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  try {
    for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Título exato na Wikipédia PT quando difere do nome do tema. */
const WIKIPEDIA_TITLE_MAP = {
  "Equações do 1º grau": "Equação linear",
  "Energia e trabalho": "Energia mecânica",
  "Meio Ambiente": "Meio ambiente",
  Ecossistemas: "Ecossistema",
  Funções: "Função (matemática)",
  "Clima e tempo": "Clima",
};

/** Snippet curado quando a Wikipédia não retorna conteúdo utilizável. */
const CURATED_FALLBACKS = {
  "Equações do 1º grau": {
    title: "Equações do 1º grau",
    summary:
      "Equação do primeiro grau é uma igualdade com uma incógnita elevada à potência 1. Resolver a equação significa encontrar o valor da incógnita que torna a igualdade verdadeira, usando propriedades das operações.",
    bodyMarkdown:
      "## Equações do 1º grau\n\nEquação do primeiro grau é uma igualdade com uma incógnita elevada à potência 1. Resolver a equação significa encontrar o valor da incógnita que torna a igualdade verdadeira, usando propriedades das operações. No Ensino Fundamental, trabalha-se com equações da forma ax + b = c, consolidando álgebra básica e resolução de problemas.",
    sourceUrl: null,
  },
  "Interpretação de texto": {
    title: "Interpretação de texto",
    summary:
      "Interpretação de texto é a capacidade de compreender ideias explícitas e implícitas em um texto, relacionando informações, vocabulário e intenção do autor. Envolve leitura atenta, inferência e verificação de evidências no enunciado.",
    bodyMarkdown:
      "## Interpretação de texto\n\nInterpretação de texto é a capacidade de compreender ideias explícitas e implícitas em um texto, relacionando informações, vocabulário e intenção do autor. Envolve leitura atenta, inferência e verificação de evidências no enunciado. Na escola, desenvolve-se com gêneros variados, perguntas orientadoras e retomada sistemática do que o texto afirma ou sugere.",
    sourceUrl: null,
  },
  Proporcionalidade: {
    title: "Proporcionalidade",
    summary:
      "Proporcionalidade descreve relações entre grandezas que variam de forma constante: direta quando aumentam juntas, inversa quando uma cresce e a outra diminui. É base para regra de três, escalas e análise de situações do cotidiano.",
    bodyMarkdown:
      "## Proporcionalidade\n\nProporcionalidade descreve relações entre grandezas que variam de forma constante: direta quando aumentam juntas, inversa quando uma cresce e a outra diminui. É base para regra de três, escalas e análise de situações do cotidiano. No Ensino Fundamental, o tema articula razão, fração e resolução de problemas contextualizados.",
    sourceUrl: null,
  },
};

const CURATED_THEMES = [
  { tema: "Fotossíntese", componente: "Ciências", etapa: "EF", anoSerie: "6º ano" },
  { tema: "Revolução Industrial", componente: "História", etapa: "EF", anoSerie: "9º ano" },
  { tema: "Sistema Solar", componente: "Ciências", etapa: "EF", anoSerie: "5º ano" },
  { tema: "Segunda Guerra Mundial", componente: "História", etapa: "EM", anoSerie: "3ª série" },
  { tema: "Equações do 1º grau", componente: "Matemática", etapa: "EF", anoSerie: "8º ano" },
  { tema: "Democracia", componente: "Geografia", etapa: "EF", anoSerie: "9º ano" },
  { tema: "Célula", componente: "Ciências", etapa: "EF", anoSerie: "7º ano" },
  { tema: "Brasil Colônia", componente: "História", etapa: "EF", anoSerie: "7º ano" },
  { tema: "Energia e trabalho", componente: "Física", etapa: "EM", anoSerie: "1ª série" },
  { tema: "Interpretação de texto", componente: "Língua Portuguesa", etapa: "EF", anoSerie: "6º ano" },
  { tema: "Meio Ambiente", componente: "Geografia", etapa: "EF", anoSerie: "6º ano" },
  { tema: "Proporcionalidade", componente: "Matemática", etapa: "EF", anoSerie: "7º ano" },
  { tema: "Imperialismo", componente: "História", etapa: "EM", anoSerie: "2ª série" },
  { tema: "Genética", componente: "Biologia", etapa: "EM", anoSerie: "2ª série" },
  { tema: "Revolução Francesa", componente: "História", etapa: "EM", anoSerie: "1ª série" },
  { tema: "Ecossistemas", componente: "Ciências", etapa: "EF", anoSerie: "8º ano" },
  { tema: "Funções", componente: "Matemática", etapa: "EM", anoSerie: "1ª série" },
  { tema: "Clima e tempo", componente: "Geografia", etapa: "EF", anoSerie: "5º ano" },
];

const WIKI_API = "https://pt.wikipedia.org/w/api.php";
const USER_AGENT = "Planify/1.0 (pedagogical seed)";
const MIN_EXTRACT_LENGTH = 80;
const RATE_LIMIT_MS = 2000;

let lastWikiRequestAt = 0;

function hashPart(text, seed) {
  let h = seed;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function computeHash(normalized) {
  return (
    hashPart(normalized, 2166136261) +
    hashPart(normalized, 709607) +
    hashPart(normalized, 374761393) +
    hashPart(normalized, 3266489917)
  ).slice(0, 32);
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeTopicSignature({ tema, componente, etapa }) {
  const normalized = [normalizeText(tema), normalizeText(componente || ""), normalizeText(etapa || "")]
    .filter(Boolean)
    .join("|");
  return computeHash(normalized || "empty");
}

function computeContentHash(body, title = "") {
  return computeHash(`${normalizeText(title)}|${normalizeText(body)}`);
}

async function rateLimitWiki() {
  const now = Date.now();
  const wait = lastWikiRequestAt + RATE_LIMIT_MS - now;
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastWikiRequestAt = Date.now();
}

async function wikiApiFetch(params, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    await rateLimitWiki();
    const query = new URLSearchParams({ ...params, format: "json", origin: "*" });
    const response = await fetch(`${WIKI_API}?${query}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(12000),
    });

    if (response.status === 429) {
      const backoff = (attempt + 1) * 3000;
      console.warn(`Wikipedia rate limit; aguardando ${backoff}ms…`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
      continue;
    }

    if (!response.ok) return null;

    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  return null;
}

async function resolveWikipediaTitle(tema) {
  if (WIKIPEDIA_TITLE_MAP[tema]) return WIKIPEDIA_TITLE_MAP[tema];

  const searchJson = await wikiApiFetch({
    action: "opensearch",
    search: tema,
    limit: "1",
    namespace: "0",
  });
  if (Array.isArray(searchJson) && searchJson[1]?.[0]) {
    return searchJson[1][0];
  }

  return tema;
}

async function fetchWikipediaExtract(title, exintro) {
  const json = await wikiApiFetch({
    action: "query",
    prop: "extracts|info",
    exintro: exintro ? "1" : "0",
    explaintext: "1",
    titles: title,
    inprop: "url",
  });

  const page = Object.values(json?.query?.pages || {})[0];
  if (!page || page.missing !== undefined) return null;

  const extract = String(page.extract || "").trim();
  if (extract.length < MIN_EXTRACT_LENGTH) return null;

  const resolvedTitle = page.title || title;
  return {
    title: resolvedTitle,
    summary: extract.slice(0, 400),
    bodyMarkdown: `## ${resolvedTitle}\n\n${extract.slice(0, 6000)}`,
    sourceUrl: page.fullurl || `https://pt.wikipedia.org/wiki/${encodeURIComponent(resolvedTitle)}`,
    license: "CC BY-SA 4.0",
  };
}

async function fetchWikipediaSummary(tema) {
  const title = await resolveWikipediaTitle(tema);
  if (!title) return null;

  const intro = await fetchWikipediaExtract(title, true);
  if (intro) return intro;

  return fetchWikipediaExtract(title, false);
}

function curatedFallback(tema) {
  const fallback = CURATED_FALLBACKS[tema];
  if (!fallback) return null;

  return {
    title: fallback.title,
    summary: fallback.summary,
    bodyMarkdown: fallback.bodyMarkdown,
    sourceUrl: fallback.sourceUrl,
    license: "Planify (curadoria interna)",
  };
}

async function resolveThemeContent(theme) {
  const wiki = await fetchWikipediaSummary(theme.tema);
  if (wiki) return { ...wiki, origin: "wikipedia" };

  const fallback = curatedFallback(theme.tema);
  if (fallback) {
    console.warn(`Fallback curado: ${theme.tema}`);
    return { ...fallback, origin: "curated" };
  }

  return null;
}

async function main() {
  const { data: source, error: sourceError } = await supabase
    .from("pedagogical_sources")
    .select("id")
    .eq("slug", "wikipedia-pt")
    .maybeSingle();

  if (sourceError || !source) {
    console.error("Fonte wikipedia-pt não encontrada. Rode a migration 20260625 primeiro.");
    process.exit(1);
  }

  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  const failures = [];

  for (const theme of CURATED_THEMES) {
    const content = await resolveThemeContent(theme);
    if (!content) {
      failed += 1;
      failures.push(theme.tema);
      console.warn(`Skip (sem conteúdo): ${theme.tema}`);
      continue;
    }

    const topicSignature = computeTopicSignature(theme);
    const contentHash = computeContentHash(content.bodyMarkdown, content.title);

    const { data: existing } = await supabase
      .from("pedagogical_cache_entries")
      .select("id, content_hash, review_status")
      .eq("topic_signature", topicSignature)
      .eq("source_id", source.id)
      .maybeSingle();

    if (existing?.content_hash === contentHash && existing.review_status === "approved") {
      skipped += 1;
      continue;
    }

    const row = {
      topic_signature: topicSignature,
      content_hash: contentHash,
      title: content.title,
      summary: content.summary,
      body_markdown: content.bodyMarkdown,
      content_type: "context",
      componente: theme.componente,
      ano_serie: theme.anoSerie,
      etapa: theme.etapa,
      source_id: source.id,
      source_url: content.sourceUrl,
      source_title: content.title,
      source_license: content.license,
      review_status: "approved",
      format_applied: false,
      ai_tokens_used: 0,
      metadata: { seed: "curated-themes", tema: theme.tema, origin: content.origin },
    };

    const { data: upserted, error: upsertError } = existing
      ? await supabase
          .from("pedagogical_cache_entries")
          .update(row)
          .eq("id", existing.id)
          .select("id")
          .single()
      : await supabase
          .from("pedagogical_cache_entries")
          .insert(row)
          .select("id")
          .single();

    if (upsertError) {
      failed += 1;
      failures.push(theme.tema);
      console.warn(`Falha ${theme.tema}:`, upsertError.message);
      continue;
    }

    await supabase.from("pedagogical_cache_aliases").upsert(
      [
        {
          entry_id: upserted.id,
          alias_key: normalizeText(theme.tema),
          alias_type: "tema",
        },
      ],
      { onConflict: "alias_key" },
    );

    inserted += 1;
  }

  console.log(
    `seed:pedagogical-themes OK — ${inserted} inserido(s)/atualizado(s), ${skipped} já ok, ${failed} falha(s).`,
  );
  if (failures.length > 0) {
    console.log("Temas com falha:", failures.join(", "));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
