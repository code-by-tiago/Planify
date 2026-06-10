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

async function fetchWikipediaSummary(tema) {
  const params = new URLSearchParams({
    action: "query",
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    format: "json",
    titles: tema,
    origin: "*",
  });

  const response = await fetch(`https://pt.wikipedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": "Planify/1.0 (pedagogical seed)" },
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) return null;
  const json = await response.json();
  const pages = json?.query?.pages;
  if (!pages) return null;

  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined) return null;

  const extract = String(page.extract || "").trim();
  if (extract.length < 80) return null;

  return {
    title: page.title || tema,
    summary: extract.slice(0, 400),
    bodyMarkdown: `## ${page.title || tema}\n\n${extract.slice(0, 6000)}`,
    sourceUrl: `https://pt.wikipedia.org/wiki/${encodeURIComponent(page.title || tema)}`,
  };
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

  for (const theme of CURATED_THEMES) {
    const wiki = await fetchWikipediaSummary(theme.tema);
    if (!wiki) {
      failed += 1;
      console.warn(`Skip (Wikipedia): ${theme.tema}`);
      continue;
    }

    const topicSignature = computeTopicSignature(theme);
    const contentHash = computeContentHash(wiki.bodyMarkdown, wiki.title);

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
      title: wiki.title,
      summary: wiki.summary,
      body_markdown: wiki.bodyMarkdown,
      content_type: "context",
      componente: theme.componente,
      ano_serie: theme.anoSerie,
      etapa: theme.etapa,
      source_id: source.id,
      source_url: wiki.sourceUrl,
      source_title: wiki.title,
      source_license: "CC BY-SA 4.0",
      review_status: "approved",
      format_applied: false,
      ai_tokens_used: 0,
      metadata: { seed: "curated-themes", tema: theme.tema },
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
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  console.log(
    `seed:pedagogical-themes OK — ${inserted} inserido(s)/atualizado(s), ${skipped} já ok, ${failed} falha(s).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
