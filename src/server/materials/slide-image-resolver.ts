/**
 * Resolve imagens reais para slides (Wikimedia Commons + Unsplash opcional).
 * Nunca retorna placeholder de "sugestão de imagem" — só URL utilizável ou null.
 */

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
      if (url && isSafeImageUrl(url)) {
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

  const hit = data.results?.find((item) => item.urls?.regular);
  if (!hit?.urls?.regular || !isSafeImageUrl(hit.urls.regular)) return null;

  return {
    url: hit.urls.regular,
    alt: hit.alt_description || hit.description || query,
  };
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

async function resolveForSlide(
  slide: {
    imagePrompt?: string;
    imageUrl?: string;
    imageAlt?: string;
    title?: string;
  },
  context: { tema: string; componente: string },
): Promise<void> {
  if (slide.imageUrl?.trim()) return;

  // Só busca com base no imagePrompt concreto do slide (ou no título como
  // apoio). Sem fallback genérico de tema+componente, que trazia imagens
  // aleatórias e sem relação com o conteúdo.
  const prompt = slide.imagePrompt?.trim() || slide.title?.trim();
  if (!prompt) return;

  const resolved = await resolveSlideImage({
    imagePrompt: prompt,
    tema: context.tema,
  });

  if (resolved) {
    slide.imageUrl = resolved.url;
    slide.imageAlt = resolved.alt;
  }
}

export async function enrichSlidesWithImages(
  slides: Array<{
    imagePrompt?: string;
    imageUrl?: string;
    imageAlt?: string;
    layout?: string;
    title?: string;
  }>,
  context: { tema: string; componente: string },
): Promise<void> {
  await Promise.all(slides.map((slide) => resolveForSlide(slide, context)));
}
