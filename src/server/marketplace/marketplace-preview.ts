import {
  isMarketplaceHtmlSource,
  resolveMarketplaceStoredKind,
  type MarketplaceExportFormat,
} from "./marketplace-download";

type MarketplacePreviewMeta = {
  file_name?: string | null;
  file_mime?: string | null;
  tipo_material?: string | null;
};

export type MarketplacePreviewKind = "html" | "pdf" | "docx" | "binary";

export function resolveMarketplacePreviewKind(
  meta: MarketplacePreviewMeta,
): MarketplacePreviewKind {
  const kind = resolveMarketplaceStoredKind(meta);

  if (kind === "html" || kind === "pdf" || kind === "docx") {
    return kind;
  }

  return "binary";
}

export function extractHtmlBody(raw: string): string {
  const trimmed = String(raw || "").trim();

  if (!trimmed) {
    return "";
  }

  const bodyMatch = trimmed.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  if (bodyMatch?.[1]) {
    return bodyMatch[1].trim();
  }

  const mainMatch = trimmed.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

  if (mainMatch?.[1]) {
    return mainMatch[1].trim();
  }

  if (/<html[\s>]/i.test(trimmed)) {
    return trimmed.replace(/<\/?html[^>]*>/gi, "").trim();
  }

  return trimmed;
}

export function sanitizePreviewHtml(html: string): string {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[^>]*>/gi, "")
<<<<<<< HEAD
    .replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
=======
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<math[\s\S]*?<\/math>/gi, "")
    .replace(/<link[^>]*>/gi, "")
    .replace(/<meta[^>]*>/gi, "")
    .replace(/<base[^>]*>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
    .replace(/\s(href|src|xlink:href|action)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, ' $1="#"')
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "data:blocked")
>>>>>>> origin/aplicar-melhorias-na-producao
    .trim();
}

export function isSlidePreviewHtml(html: string, meta: MarketplacePreviewMeta): boolean {
  const tipo = String(meta.tipo_material || "").toLowerCase();

  if (tipo.includes("slide")) {
    return true;
  }

  return /planify-slide-deck|class=["'][^"']*planify-slide/i.test(html);
}

export function buildPreviewHtmlContent(params: {
  storedBuffer: Buffer;
  meta: MarketplacePreviewMeta;
}): string | null {
  if (!isMarketplaceHtmlSource(params.meta)) {
    return null;
  }

  const raw = params.storedBuffer.toString("utf-8");
  const body = extractHtmlBody(raw);
  const sanitized = sanitizePreviewHtml(body);

  return sanitized || null;
}

export function resolvePreviewDownloadFormats(
  kind: MarketplacePreviewKind,
): MarketplaceExportFormat[] {
  if (kind === "html") {
    return ["docx", "pdf"];
  }

  if (kind === "pdf") {
    return ["pdf"];
  }

  if (kind === "docx") {
    return ["docx"];
  }

<<<<<<< HEAD
  return ["docx", "pdf"];
=======
  // PPTX/imagem/binário: "html" no download devolve o arquivo original.
  return ["html"];
>>>>>>> origin/aplicar-melhorias-na-producao
}
