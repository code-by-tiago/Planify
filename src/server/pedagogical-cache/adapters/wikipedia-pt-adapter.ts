import "server-only";

import type {
  PedagogicalScrapeQuery,
  PedagogicalScrapeResult,
  PedagogicalSourceAdapter,
} from "./pedagogical-source-adapter";
import { isRobotsAllowed } from "../robots-policy";

const WIKI_API = "https://pt.wikipedia.org/w/api.php";
const USER_AGENT = "Planify/1.0 (pedagogical cache; contact: planify-app)";
const MAX_BODY_BYTES = 8 * 1024;

let lastRequestAt = 0;

async function rateLimit(ms = 1000): Promise<void> {
  const now = Date.now();
  const wait = lastRequestAt + ms - now;
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();
}

function truncateSummary(text: string, max = 400): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

function limitBody(text: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(text).length <= MAX_BODY_BYTES) return text;

  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (encoder.encode(text.slice(0, mid)).length <= MAX_BODY_BYTES) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return `${text.slice(0, Math.max(0, low - 1)).trim()}…`;
}

async function wikiFetch(params: Record<string, string>): Promise<Response> {
  await rateLimit();
  const url = new URL(WIKI_API);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(10000),
  });
}

async function resolveTitle(tema: string): Promise<string | null> {
  const response = await wikiFetch({
    action: "opensearch",
    search: tema,
    limit: "1",
    namespace: "0",
    format: "json",
  });

  if (!response.ok) return null;
  const json = (await response.json()) as [string, string[], string[], string[]];
  return json[1]?.[0] || null;
}

export const wikipediaPtAdapter: PedagogicalSourceAdapter = {
  slug: "wikipedia-pt",

  canHandle(query: PedagogicalScrapeQuery): boolean {
    return Boolean(query.tema?.trim());
  },

  async fetch(query: PedagogicalScrapeQuery): Promise<PedagogicalScrapeResult | null> {
    const tema = query.tema.trim();
    if (!tema) return null;

    const allowed = await isRobotsAllowed("https://pt.wikipedia.org/", USER_AGENT);
    if (!allowed) return null;

    const title = await resolveTitle(tema);
    if (!title) return null;

    const response = await wikiFetch({
      action: "query",
      prop: "extracts|info",
      exintro: "1",
      explaintext: "1",
      titles: title,
      format: "json",
      inprop: "url",
    });

    if (!response.ok) return null;

    const json = (await response.json()) as {
      query?: {
        pages?: Record<
          string,
          { title?: string; extract?: string; fullurl?: string; missing?: boolean }
        >;
      };
    };

    const page = Object.values(json.query?.pages || {})[0];
    if (!page || page.missing || !page.extract) return null;

    const body = limitBody(page.extract);
    const sourceUrl = page.fullurl || `https://pt.wikipedia.org/wiki/${encodeURIComponent(title)}`;

    return {
      title: page.title || title,
      summary: truncateSummary(body),
      bodyMarkdown: `## ${page.title || title}\n\n${body}`,
      sourceUrl,
      sourceTitle: page.title || title,
      license: "CC BY-SA 4.0",
      contentType: "context",
      confidence: 0.75,
    };
  },
};
