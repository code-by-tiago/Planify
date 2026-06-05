import type { MaterialEngineResponse } from "./material-engine-types";

type SlideItem = NonNullable<MaterialEngineResponse["slides"]>[number];

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function stripTags(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? stripTags(match[1]) : "";
}

function extractListItems(block: string): string[] {
  const items: string[] = [];
  const listMatch = block.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
  if (!listMatch) return items;

  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null = liRegex.exec(listMatch[1]);
  while (match) {
    const text = stripTags(match[1]);
    if (text) items.push(text);
    match = liRegex.exec(listMatch[1]);
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

function detectLayout(block: string, index: number, total: number): SlideItem["layout"] {
  if (/CAPA|Abertura|gradient/i.test(block) && index === 0) return "capa";
  if (/FECHAMENTO|Síntese/i.test(block) && index === total - 1) return "fechamento";
  if (/duasColunas|flex-wrap/i.test(block)) return "duasColunas";
  if (/destaque|text-align:center/i.test(block)) return "destaque";
  return "conteudo";
}

/** Extrai slides do HTML gerado pelo Planify (fallback quando não há JSON estrutura). */
export function parseSlidesFromPlanifyHtml(html: string): SlideItem[] {
  const source = String(html || "");
  const parts = source.split(/<div[^>]*class=["'][^"']*planify-slide[^"']*["'][^>]*>/i);

  if (parts.length <= 1) return [];

  const blocks = parts.slice(1).map((part) => part.split(/<\/div>\s*(?=<div|$)/i)[0] || part);

  return blocks.map((block, index) => {
    const layout = detectLayout(block, index, blocks.length);
    const title = extractTag(block, "h3") || extractTag(block, "h2") || `Slide ${index + 1}`;
    const bullets = extractListItems(block);
    const notesMatch = block.match(/Notas do professor[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i);
    const speakerNotes = notesMatch ? stripTags(notesMatch[1]) : "";
    const { imageUrl, imageAlt } = extractImage(block);

    return {
      title,
      bullets,
      speakerNotes,
      layout,
      imageUrl,
      imageAlt,
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
