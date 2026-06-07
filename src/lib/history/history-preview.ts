import { planifyTools } from "../pro/planifyTools";

export function isHistoryHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content.trim());
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Conteúdo bruto ou HTML do histórico → HTML exportável (Classroom, DOCX, etc.). */
export function historyItemContentToHtml(content: string): string {
  const trimmed = String(content || "").trim();
  if (!trimmed) return "";
  if (isHistoryHtmlContent(trimmed)) return trimmed;

  return trimmed
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function buildHistoryContentPreview(
  content: string,
  maxLength = 260,
): string {
  const normalized = isHistoryHtmlContent(content)
    ? content
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : content.trim();

  return normalized.slice(0, maxLength);
}

export function resolveHistoryTypeLabel(type: string): string {
  const raw = String(type || "")
    .trim()
    .replace(/^material:/, "");

  const tool = planifyTools.find((entry) => entry.id === raw);
  if (tool) {
    return tool.shortTitle || tool.title;
  }

  return raw || "Documento";
}

export function historyItemNeedsPreviewNormalize(item: {
  content: string;
  contentPreview: string;
}): boolean {
  const preview = String(item.contentPreview || "");
  const content = String(item.content || "");

  if (!content) {
    return false;
  }

  if (preview.includes("<") || preview.includes("style=")) {
    return true;
  }

  return preview !== buildHistoryContentPreview(content);
}
