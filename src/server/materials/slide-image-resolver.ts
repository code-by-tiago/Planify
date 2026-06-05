/**
 * Resolve imagens reais para slides (Wikimedia Commons + Unsplash opcional).
 * Nunca retorna placeholder de "sugestão de imagem" — só URL utilizável ou null.
 */

const WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "Planify/1.0 (educational slides; contact: planify-app)";

function normalizeSearchTerms(
  imagePrompt: string,
  tema: string,
  componente: string,
): string[] {
  const raw = `${imagePrompt} ${tema} ${componente}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3);

  const unique = [...new Set(raw)].slice(0, 6);
  if (!unique.length) return [tema.slice(0, 40) || "education"];

  return [
    unique.join(" "),
    unique.slice(0, 3).join(" "),
    unique.slice(0, 2).join(" "),
  ];
}

function isSafeImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host.endsWith("wikimedia.org") ||
      host.endsWith("wikipedia.org") ||
      host === "images.unsplash.com"
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
  componente: string;
}): Promise<{ url: string; alt: string } | null> {
  const prompt = input.imagePrompt.trim();
  if (!prompt) return null;

  const queries = normalizeSearchTerms(prompt, input.tema, input.componente);

  for (const query of queries) {
    const wiki = await searchWikimedia(query);
    if (wiki) return wiki;
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

  const prompt =
    slide.imagePrompt?.trim() ||
    slide.title?.trim() ||
    context.tema;

  let resolved = await resolveSlideImage({
    imagePrompt: prompt,
    tema: context.tema,
    componente: context.componente,
  });

  if (!resolved && slide.imagePrompt?.trim()) {
    resolved = await resolveSlideImage({
      imagePrompt: `${context.tema} ${context.componente} educação`,
      tema: context.tema,
      componente: context.componente,
    });
  }

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
