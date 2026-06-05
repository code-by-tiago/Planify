import type { MaterialEngineResponse } from "./material-engine-types";

type SlideItem = NonNullable<MaterialEngineResponse["slides"]>[number];

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8226;/g, "")
    .replace(/[•●▪]/g, "");
}

function stripTags(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? stripTags(match[1]) : "";
}

/** Coleta TODOS os <li> do bloco (não só do primeiro <ul>). */
function extractListItems(block: string): string[] {
  const items: string[] = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null = liRegex.exec(block);
  while (match) {
    const text = stripTags(match[1]);
    if (text) items.push(text);
    match = liRegex.exec(block);
  }
  return items;
}

function extractImage(block: string): { imageUrl?: string; imageAlt?: string } {
  const match = block.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (!match) return {};

  const altMatch = block.match(/<img[^>]+alt=["']([^"']*)["'][^>]*>/i);
  return {
    imageUrl: decodeHtmlEntities(match[1]),
    imageAlt: altMatch ? decodeHtmlEntities(altMatch[1]) : undefined,
  };
}

function extractSpeakerNotes(block: string): string {
  const match = block.match(
    /Notas do professor[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i,
  );
  return match ? stripTags(match[1]) : "";
}

function extractSubtitle(block: string): string | undefined {
  const paragraphs = [...block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  for (const paragraph of paragraphs) {
    const text = stripTags(paragraph[1]);
    if (!text) continue;
    if (/^\d+\s*slides?$/i.test(text)) continue;
    if (/notas do professor/i.test(text)) continue;
    return text;
  }
  return undefined;
}

function extractCallout(
  block: string,
): { title?: string; text?: string } | undefined {
  const starMatch = block.match(/★\s*([^<]{2,120})/);
  const title = starMatch ? decodeHtmlEntities(starMatch[1]).trim() : undefined;

  const paragraphs = [...block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((p) => stripTags(p[1]))
    .filter(
      (text) =>
        text &&
        !/^\d+\s*slides?$/i.test(text) &&
        !/notas do professor/i.test(text) &&
        (!title || !text.includes(title)),
    );

  if (!title && !paragraphs.length) return undefined;

  return {
    title,
    text: paragraphs[paragraphs.length - 1] || undefined,
  };
}

function detectLayout(block: string, index: number, total: number): SlideItem["layout"] {
  const isCover =
    index === 0 &&
    (/Planify\s*[·:]\s*Apresenta/i.test(block) || /linear-gradient/i.test(block));
  if (isCover) return "capa";
  if (index === total - 1 && /FECHAMENTO|S[íi]ntese/i.test(block)) {
    return "fechamento";
  }
  if (/flex-wrap/i.test(block)) return "duasColunas";
  if (/text-align:\s*center/i.test(block)) return "destaque";
  return "conteudo";
}

/**
 * Extrai cada bloco `.planify-slide` por balanceamento de <div>, capturando
 * o conteúdo completo (inclusive divs aninhadas). Evita o corte prematuro no
 * primeiro </div> que deixava os slides quase vazios no Google Apresentações.
 */
function extractSlideBlocks(html: string): string[] {
  const blocks: string[] = [];
  const openRe = /<div\b[^>]*class=["'][^"']*planify-slide[^"']*["'][^>]*>/gi;
  let open: RegExpExecArray | null = openRe.exec(html);

  while (open) {
    const start = open.index;
    let depth = 1;
    const tagRe = /<\/?div\b[^>]*>/gi;
    tagRe.lastIndex = openRe.lastIndex;
    let end = html.length;
    let tag: RegExpExecArray | null = tagRe.exec(html);

    while (tag) {
      if (tag[0].startsWith("</")) {
        depth -= 1;
        if (depth === 0) {
          end = tagRe.lastIndex;
          break;
        }
      } else {
        depth += 1;
      }
      tag = tagRe.exec(html);
    }

    blocks.push(html.slice(start, end));
    openRe.lastIndex = end;
    open = openRe.exec(html);
  }

  return blocks;
}

/** Lê o tema de design embutido no HTML (data-planify-slide-theme). */
export function extractSlideThemeFromHtml(html: string): string | undefined {
  const match = String(html || "").match(
    /data-planify-slide-theme=["']([a-z]+)["']/i,
  );
  return match ? match[1].toLowerCase() : undefined;
}

/** Extrai slides do HTML gerado pelo Planify (fallback quando não há JSON estrutura). */
export function parseSlidesFromPlanifyHtml(html: string): SlideItem[] {
  const source = String(html || "");
  const blocks = extractSlideBlocks(source);
  if (!blocks.length) return [];

  return blocks.map((block, index) => {
    const layout = detectLayout(block, index, blocks.length);
    const title =
      extractTag(block, "h3") || extractTag(block, "h2") || `Slide ${index + 1}`;
    const bullets = extractListItems(block);
    const speakerNotes = extractSpeakerNotes(block);
    const { imageUrl, imageAlt } = extractImage(block);
    const subtitle =
      layout === "capa" || layout === "fechamento"
        ? extractSubtitle(block)
        : undefined;
    const callout = layout === "capa" ? undefined : extractCallout(block);

    return {
      title,
      bullets,
      speakerNotes,
      layout,
      subtitle,
      imageUrl,
      imageAlt,
      callout: callout?.text || callout?.title ? callout : undefined,
      sequenceStep: layout === "capa" ? 0 : index,
      sequenceLabel:
        layout === "capa"
          ? "Abertura"
          : layout === "fechamento"
            ? "Síntese"
            : `Etapa ${index}`,
    };
  });
}
