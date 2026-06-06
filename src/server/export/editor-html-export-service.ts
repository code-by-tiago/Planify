import { MAX_EXPORT_FILE_BYTES } from "@/lib/ai/material-generation-policy";
import { wrapAsPlanifyExportHtml } from "../../lib/editor/editor-print-html";
import { buildNativeHtmlDocx } from "../docx/simple-docx-builder";
import { extractBodyHtml } from "../editor/html-inner-text";
import { prepareHtmlForExport } from "../editor/prepare-export-html";
import { renderHtmlToPdfBuffer } from "../pdf/html-to-pdf";

export type EditorHtmlExportFormat = "docx" | "pdf" | "html";

function cleanFilename(value: string): string {
  const cleaned = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);

  return cleaned || "documento-planify";
}

export function resolveEditorHtmlBody(html: string): string {
  const trimmed = String(html || "").trim();

  if (!trimmed) {
    return "";
  }

  if (/<html[\s>]/i.test(trimmed)) {
    return extractBodyHtml(trimmed);
  }

  return trimmed;
}

export function buildEditorExportDocumentHtml(title: string, html: string): string {
  const body = prepareHtmlForExport(resolveEditorHtmlBody(html));
  return wrapAsPlanifyExportHtml(title, body);
}

export async function exportEditorHtmlDocument(params: {
  title: string;
  html: string;
  format: EditorHtmlExportFormat;
}): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  const title = String(params.title || "Documento Planify").trim() || "Documento Planify";
  const body = resolveEditorHtmlBody(params.html);
  const hasText = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length > 0;

  if (!hasText) {
    throw new Error("O documento está vazio. Adicione conteúdo antes de exportar.");
  }

  const exportHtml = buildEditorExportDocumentHtml(title, params.html);
  const filename = cleanFilename(title);

  if (params.format === "html") {
    const buffer = Buffer.from(exportHtml, "utf-8");
    if (buffer.byteLength > MAX_EXPORT_FILE_BYTES) {
      throw new Error(
        "O documento é muito grande para exportar (máximo 15 MB). Reduza imagens ou divida o material.",
      );
    }
    return {
      buffer,
      contentType: "text/html; charset=utf-8",
      filename: `${filename}.html`,
    };
  }

  if (params.format === "docx") {
    const body = resolveEditorHtmlBody(params.html);
    const preparedBody = prepareHtmlForExport(body);

    const buffer = buildNativeHtmlDocx({
      title,
      htmlBody: preparedBody,
    });
    if (buffer.byteLength > MAX_EXPORT_FILE_BYTES) {
      throw new Error(
        "O documento é muito grande para exportar em DOCX (máximo 15 MB). Reduza imagens ou divida o material.",
      );
    }
    return {
      buffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      filename: `${filename}.docx`,
    };
  }

  const pdfBuffer = await renderHtmlToPdfBuffer(exportHtml);
  if (pdfBuffer.byteLength > MAX_EXPORT_FILE_BYTES) {
    throw new Error(
      "O documento é muito grande para exportar em PDF (máximo 15 MB). Reduza imagens ou divida o material.",
    );
  }

  return {
    buffer: pdfBuffer,
    contentType: "application/pdf",
    filename: `${filename}.pdf`,
  };
}
