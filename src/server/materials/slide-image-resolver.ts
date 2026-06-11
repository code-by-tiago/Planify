/**
 * Resolve imagens para slides. Prioridade:
 *   1) Ilustração Imagen 4 (IMAGEN_MODEL + GEMINI_API_KEY) — condiz com o slide.
 *   2) Foto de stock relevante (Wikimedia/Openverse/Unsplash), com filtro.
 *   3) Nenhuma imagem (o design do tema preenche o espaço).
 * Nunca retorna placeholder de "sugestão de imagem" nem foto sem relação.
 */

import { generateSlideIllustration } from "./slide-image-generator";

const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "Planify/1.0 (educational slides; contact: planify-app)";

const STOPWORDS = new Set([
  "conceito",
  "conceitos",
  "aprendizado",
  "aprendizagem",
  "educacao",
  "educacional",
  "ensino",
  "aula",
  "estudo",
  "exemplo",
  "imagem",
  "ilustracao",
  "slide",
  "tema",
  "sobre",
  "para",
  "como",
  "the",
  "and",
  "with",
]);

function cleanWords(value: string): string[] {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/**
 * Aceita o resultado só se o título/descrição compartilhar pelo menos uma
 * palavra significativa com a consulta. Evita devolver fotos aleatórias
 * (ex.: "SPACE" ou uma refeição) sem relação com o conteúdo do slide.
 */
function isRelevantResult(text: string, query: string): boolean {
  const queryWords = cleanWords(query).filter((word) => word.length >= 4);
  if (!queryWords.length) return false;
  const haystack = ` ${cleanWords(text).join(" ")} `;
  return queryWords.some((word) => haystack.includes(` ${word} `) || haystack.includes(word));
}

/**
 * Gera consultas priorizando o imagePrompt concreto do slide. O tema entra
 * apenas como fallback leve — nunca diluído com componente/"educação", para
 * não trazer imagens aleatórias e sem relação com o conteúdo.
 */
function normalizeSearchTerms(imagePrompt: string, tema: string): string[] {
  const promptWords = cleanWords(imagePrompt);
  const queries: string[] = [];

  if (promptWords.length) {
    queries.push(promptWords.slice(0, 4).join(" "));
    if (promptWords.length > 2) queries.push(promptWords.slice(0, 2).join(" "));
  }

  const temaWords = cleanWords(tema);
  if (temaWords.length) {
    queries.push(temaWords.slice(0, 3).join(" "));
  }

  return [...new Set(queries.filter(Boolean))];
}

function isSafeImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host.endsWith("wikimedia.org") ||
      host.endsWith("wikipedia.org") ||
      host === "images.unsplash.com" ||
      host === "api.openverse.org" ||
      host.endsWith(".openverse.org")
    );
  } catch {
    return false;
  }
}

async function searchWikimedia(query: string): Promise<{ url: string; alt: string } | null> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: `filetype:bitmap ${query}`,
    gsrlimit: "6",
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: "960",
    format: "json",
  });

  const response = await fetch(`${WIKIMEDIA_API}?${params}`, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    query?: {
      pages?: Record<
        string,
        { title?: string; imageinfo?: Array<{ thumburl?: string; url?: string }> }
      >;
    };
  };

  const pages = data.query?.pages;
  if (!pages) return null;

  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0];
    const url = info?.thumburl || info?.url;
    if (url && isSafeImageUrl(url)) {
      const alt = (page.title || query).replace(/^File:/i, "").replace(/\.[^.]+$/, "");
      if (!isRelevantResult(alt, query)) continue;
      return { url, alt };
    }
  }

  return null;
}

async function searchOpenverse(
  query: string,
): Promise<{ url: string; alt: string } | null> {
  const params = new URLSearchParams({
    q: query,
    page_size: "4",
    license_type: "all",
    mature: "false",
  });

  try {
    const response = await fetch(
      `https://api.openverse.org/v1/images/?${params}`,
      {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      results?: Array<{
        title?: string;
        thumbnail?: string;
        url?: string;
      }>;
    };

    for (const hit of data.results ?? []) {
      // O thumbnail fica em api.openverse.org (host estável e seguro).
      const url = hit.thumbnail || hit.url;
      if (url && isSafeImageUrl(url) && isRelevantResult(hit.title || "", query)) {
        return { url, alt: hit.title || query };
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function searchUnsplash(query: string): Promise<{ url: string; alt: string } | null> {
  const key = String(process.env.UNSPLASH_ACCESS_KEY || "").trim();
  if (!key) return null;

  const params = new URLSearchParams({
    query,
    per_page: "3",
    orientation: "landscape",
    content_filter: "high",
  });

  const response = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: { Authorization: `Client-ID ${key}` },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    results?: Array<{
      alt_description?: string;
      description?: string;
      urls?: { regular?: string };
    }>;
  };

  for (const item of data.results ?? []) {
    const url = item.urls?.regular;
    if (!url || !isSafeImageUrl(url)) continue;
    const description = item.alt_description || item.description || "";
    if (!isRelevantResult(description, query)) continue;
    return { url, alt: description || query };
  }

  return null;
}

export async function resolveSlideImage(input: {
  imagePrompt: string;
  tema: string;
}): Promise<{ url: string; alt: string } | null> {
  const prompt = input.imagePrompt.trim();
  if (!prompt) return null;

  const queries = normalizeSearchTerms(prompt, input.tema);
  if (!queries.length) return null;

  for (const query of queries) {
    const wiki = await searchWikimedia(query);
    if (wiki) return wiki;
  }

  for (const query of queries) {
    const openverse = await searchOpenverse(query);
    if (openverse) return openverse;
  }

  for (const query of queries) {
    const unsplash = await searchUnsplash(query);
    if (unsplash) return unsplash;
  }

  return null;
}

type EnrichableSlide = {
  imagePrompt?: string;
  imageUrl?: string;
  imageAlt?: string;
  layout?: string;
  title?: string;
};

/** Teto de imagens geradas por IA por apresentação (controla custo/latência). */
const MAX_AI_IMAGES = 16;
/** Quantas gerações de imagem correm em paralelo. */
const IMAGE_CONCURRENCY = 4;

async function resolveForSlide(
  slide: EnrichableSlide,
  context: { tema: string },
  allowAi: () => boolean,
): Promise<void> {
  if (slide.imageUrl?.trim()) return;
  if (slide.layout === "fechamento") return;

  // O imagePrompt concreto do slide (ou o título como apoio) é a base. Sem
  // fallback genérico de tema+componente, que trazia imagens sem relação.
  const prompt = slide.imagePrompt?.trim() || slide.title?.trim();
  if (!prompt) return;

  // 1) Ilustração gerada por IA — sempre condiz com o conteúdo do slide.
  if (allowAi()) {
    try {
      const generated = await generateSlideIllustration({
        imagePrompt: prompt,
        tema: context.tema,
      });
      if (generated) {
        slide.imageUrl = generated.url;
        slide.imageAlt = generated.alt;
        return;
      }
    } catch {
      // segue para o fallback de foto de stock
    }
  }

  // 2) Foto de stock relevante (com filtro). 3) Nenhuma imagem.
  try {
    const resolved = await resolveSlideImage({ imagePrompt: prompt, tema: context.tema });
    if (resolved) {
      slide.imageUrl = resolved.url;
      slide.imageAlt = resolved.alt;
    }
  } catch {
    // mantém o slide sem imagem — o design preenche o espaço
  }
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  const runners = Array.from(
    { length: Math.min(limit, queue.length) },
    async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
        await worker(item);
      }
    },
  );
  await Promise.all(runners);
}

/**
 * Ilustrações Imagen 4 usam GEMINI_API_KEY + IMAGEN_MODEL (ex.: imagen-4).
 * Com GEMINI_API_KEY configurada, fica ligado por padrão.
 * Desligue com SLIDE_AI_IMAGES=0 se quiser só Wikimedia/stock.
 */
function aiImagesEnabled(): boolean {
  const flag = String(process.env.SLIDE_AI_IMAGES || "").toLowerCase();

  if (flag === "0" || flag === "false" || flag === "off") {
    return false;
  }

  if (flag === "1" || flag === "true" || flag === "on") {
    return true;
  }

  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export async function enrichSlidesWithImages(
  slides: EnrichableSlide[],
  context: { tema: string; componente: string },
): Promise<void> {
  let aiBudget = aiImagesEnabled() ? MAX_AI_IMAGES : 0;
  const allowAi = () => {
    if (aiBudget <= 0) return false;
    aiBudget -= 1;
    return true;
  };

  await runWithConcurrency(slides, IMAGE_CONCURRENCY, (slide) =>
    resolveForSlide(slide, { tema: context.tema }, allowAi),
  );
}
