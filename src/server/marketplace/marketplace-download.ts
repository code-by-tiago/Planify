export type MarketplaceExportFormat = "docx" | "pdf" | "html";

type MarketplaceFileMeta = {
  file_name?: string | null;
  file_mime?: string | null;
};

export function parseMarketplaceExportFormat(
  value: string | null | undefined,
): MarketplaceExportFormat {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "pdf" || normalized === "html") {
    return normalized;
  }

  return "docx";
}

export function isMarketplaceHtmlSource(meta: MarketplaceFileMeta): boolean {
  const name = String(meta.file_name || "").toLowerCase();
  const mime = String(meta.file_mime || "").toLowerCase();

  return (
    name.endsWith(".html") ||
    name.endsWith(".htm") ||
    mime.includes("html") ||
    mime === "text/plain"
  );
}

export function resolveMarketplaceDownloadMime(meta: MarketplaceFileMeta): string {
  const name = String(meta.file_name || "").toLowerCase();
  const mime = String(meta.file_mime || "").toLowerCase();

  if (
    name.endsWith(".html") ||
    name.endsWith(".htm") ||
    mime.includes("html")
  ) {
    return "text/html; charset=utf-8";
  }

  if (name.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  if (name.endsWith(".doc")) {
    return "application/msword";
  }

  if (name.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (mime && mime !== "text/plain") {
    return mime;
  }

  return "application/octet-stream";
}

export function resolveMarketplaceStoredMime(file: File): string {
  const name = (file.name || "").toLowerCase();

  if (name.endsWith(".html") || name.endsWith(".htm")) {
    return "text/html; charset=utf-8";
  }

  return file.type || "application/octet-stream";
}

function safeMarketplaceTitle(title: string): string {
  return String(title || "material-planify")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildMarketplaceExportFilename(
  title: string,
  format: MarketplaceExportFormat,
): string {
  const safeTitle = safeMarketplaceTitle(title);
  return `${safeTitle || "material-planify"}.${format}`;
}

export function buildMarketplaceDownloadFilename(
  fileName: string | null | undefined,
  title: string,
): string {
  const trimmed = String(fileName || "").trim();

  if (trimmed) {
    return trimmed;
  }

  return `${safeMarketplaceTitle(title) || "material-planify"}.html`;
}

export function buildContentDispositionAttachment(filename: string): string {
  const asciiFallback = filename
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\x20-\x7E]+/g, "_")
    .replace(/["\\]/g, "_");

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
