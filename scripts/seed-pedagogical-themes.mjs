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
  "Brasil República": "República Velha",
  "Escravidão no Brasil": "Escravidão no Brasil",
  "Independência do Brasil": "Independência do Brasil",
  "Grécia Antiga": "Grécia Antiga",
  "Roma Antiga": "Roma Antiga",
  "Guerra Fria": "Guerra Fria",
  "Ditadura Militar no Brasil": "Ditadura militar no Brasil",
  "Concordância verbal": "Concordância verbal",
  "Regência verbal": "Regência verbal",
  Ortografia: "Ortografia",
  "Gêneros textuais": "Gênero textual",
  "Produção de texto": "Produção textual",
  Frações: "Fração",
  "Área e perímetro": "Área",
  Porcentagem: "Porcentagem",
  "Estatística básica": "Estatística",
  Trigonometria: "Trigonometria",
  Logaritmo: "Logaritmo",
  "Sistema respiratório": "Sistema respiratório",
  "Máquinas simples": "Máquina simples",
  "Estados da matéria": "Estado da matéria",
  "Cadeia alimentar": "Cadeia alimentar",
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
  Crase: {
    title: "Crase",
    summary:
      "Crase é a fusão da preposição a com o artigo feminino a ou com pronomes demonstrativos e possessivos femininos. Ocorre em locuções adverbiais femininas, antes de nomes femininos e em casos facultativos conforme a pronúncia.",
    bodyMarkdown:
      "## Crase\n\nCrase é a fusão da preposição a com o artigo feminino a ou com pronomes demonstrativos e possessivos femininos. Ocorre em locuções adverbiais femininas, antes de nomes femininos e em casos facultativos conforme a pronúncia. No ensino, trabalha-se com regras de obrigatoriedade, proibição e facultatividade.",
    sourceUrl: null,
  },
  "Sistema digestório": {
    title: "Sistema digestório",
    summary:
      "O sistema digestório transforma alimentos em nutrientes por meio de órgãos como boca, esôfago, estômago e intestinos, com auxílio de enzimas e movimentos peristálticos.",
    bodyMarkdown:
      "## Sistema digestório\n\nO sistema digestório transforma alimentos em nutrientes por meio de órgãos como boca, esôfago, estômago e intestinos, com auxílio de enzimas e movimentos peristálticos. A digestão mecânica e química prepara moléculas para absorção e distribuição pelo organismo.",
    sourceUrl: null,
  },
  "Geometria plana": {
    title: "Geometria plana",
    summary:
      "Geometria plana estuda figuras bidimensionais, medidas de comprimento, área, perímetro e relações entre ângulos, lados e propriedades de polígonos e circunferências.",
    bodyMarkdown:
      "## Geometria plana\n\nGeometria plana estuda figuras bidimensionais, medidas de comprimento, área, perímetro e relações entre ângulos, lados e propriedades de polígonos e circunferências. No Ensino Fundamental e Médio, articula visualização espacial, demonstrações e resolução de problemas.",
    sourceUrl: null,
  },
  "Idade Média": {
    title: "Idade Média",
    summary:
      "A Idade Média no Ocidente (séculos V a XV) envolve feudalismo, Igreja Católica, reinos germânicos, comércio e formação de identidades europeias após o Império Romano.",
    bodyMarkdown:
      "## Idade Média\n\nA Idade Média no Ocidente (séculos V a XV) envolve feudalismo, Igreja Católica, reinos germânicos, comércio e formação de identidades europeias após o Império Romano. O período articula sociedade rural, poder político descentralizado e transformações urbanas.",
    sourceUrl: null,
  },
  "Figuras de linguagem": {
    title: "Figuras de linguagem",
    summary:
      "Figuras de linguagem são recursos expressivos que ampliam sentidos do texto por meio de comparações, metáforas, ironias, hipérboles e outras estratégias estilísticas.",
    bodyMarkdown:
      "## Figuras de linguagem\n\nFiguras de linguagem são recursos expressivos que ampliam sentidos do texto por meio de comparações, metáforas, ironias, hipérboles e outras estratégias estilísticas. A identificação exige atenção ao contexto e à intenção comunicativa do autor.",
    sourceUrl: null,
  },
  "Números inteiros": {
    title: "Números inteiros",
    summary:
      "Números inteiros incluem positivos, negativos e zero, permitindo representar ganhos e perdas, temperaturas, altitudes e movimentos em sentidos opostos.",
    bodyMarkdown:
      "## Números inteiros\n\nNúmeros inteiros incluem positivos, negativos e zero, permitindo representar ganhos e perdas, temperaturas, altitudes e movimentos em sentidos opostos. Operações com inteiros exigem atenção a sinais e à reta numérica.",
    sourceUrl: null,
  },
  "Corpo humano": {
    title: "Corpo humano",
    summary:
      "O corpo humano é organizado em sistemas que mantêm a vida, como respiratório, circulatório, nervoso e locomotor, integrando órgãos e funções.",
    bodyMarkdown:
      "## Corpo humano\n\nO corpo humano é organizado em sistemas que mantêm a vida, como respiratório, circulatório, nervoso e locomotor, integrando órgãos e funções. O estudo articula anatomia básica, hábitos saudáveis e relação entre estrutura e função.",
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
  { tema: "Brasil República", componente: "História", etapa: "EF", anoSerie: "9º ano" },
  { tema: "Escravidão no Brasil", componente: "História", etapa: "EF", anoSerie: "8º ano" },
  { tema: "Independência do Brasil", componente: "História", etapa: "EF", anoSerie: "8º ano" },
  { tema: "Idade Média", componente: "História", etapa: "EF", anoSerie: "7º ano" },
  { tema: "Grécia Antiga", componente: "História", etapa: "EF", anoSerie: "6º ano" },
  { tema: "Roma Antiga", componente: "História", etapa: "EF", anoSerie: "7º ano" },
  { tema: "Guerra Fria", componente: "História", etapa: "EM", anoSerie: "3ª série" },
  { tema: "Ditadura Militar no Brasil", componente: "História", etapa: "EM", anoSerie: "3ª série" },
  { tema: "Crase", componente: "Língua Portuguesa", etapa: "EF", anoSerie: "8º ano" },
  { tema: "Concordância verbal", componente: "Língua Portuguesa", etapa: "EF", anoSerie: "7º ano" },
  { tema: "Regência verbal", componente: "Língua Portuguesa", etapa: "EF", anoSerie: "9º ano" },
  { tema: "Ortografia", componente: "Língua Portuguesa", etapa: "EF", anoSerie: "6º ano" },
  { tema: "Figuras de linguagem", componente: "Língua Portuguesa", etapa: "EF", anoSerie: "8º ano" },
  { tema: "Gêneros textuais", componente: "Língua Portuguesa", etapa: "EF", anoSerie: "6º ano" },
  { tema: "Produção de texto", componente: "Língua Portuguesa", etapa: "EF", anoSerie: "7º ano" },
  { tema: "Frações", componente: "Matemática", etapa: "EF", anoSerie: "6º ano" },
  { tema: "Números inteiros", componente: "Matemática", etapa: "EF", anoSerie: "7º ano" },
  { tema: "Geometria plana", componente: "Matemática", etapa: "EF", anoSerie: "8º ano" },
  { tema: "Área e perímetro", componente: "Matemática", etapa: "EF", anoSerie: "5º ano" },
  { tema: "Porcentagem", componente: "Matemática", etapa: "EF", anoSerie: "9º ano" },
  { tema: "Estatística básica", componente: "Matemática", etapa: "EF", anoSerie: "9º ano" },
  { tema: "Trigonometria", componente: "Matemática", etapa: "EM", anoSerie: "1ª série" },
  { tema: "Logaritmo", componente: "Matemática", etapa: "EM", anoSerie: "2ª série" },
  { tema: "Sistema digestório", componente: "Ciências", etapa: "EF", anoSerie: "8º ano" },
  { tema: "Sistema respiratório", componente: "Ciências", etapa: "EF", anoSerie: "6º ano" },
  { tema: "Corpo humano", componente: "Ciências", etapa: "EF", anoSerie: "5º ano" },
  { tema: "Máquinas simples", componente: "Ciências", etapa: "EF", anoSerie: "8º ano" },
  { tema: "Estados da matéria", componente: "Ciências", etapa: "EF", anoSerie: "6º ano" },
  { tema: "Cadeia alimentar", componente: "Ciências", etapa: "EF", anoSerie: "5º ano" },
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
