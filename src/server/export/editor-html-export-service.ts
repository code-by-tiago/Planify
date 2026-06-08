import { MAX_EXPORT_FILE_BYTES } from "@/lib/ai/material-generation-policy";
import { detectMaterialExportKind } from "@/lib/export/classroom-export-format";
import {
  wrapAsPlanifyExportHtml,
  wrapAsSlideExportHtml,
} from "../../lib/editor/editor-print-html";
import { buildNativeHtmlDocx } from "../docx/simple-docx-builder";
import { extractBodyHtml } from "../editor/html-inner-text";
import {
  prepareHtmlForExport,
  stripTeacherOnlyExportBlocks,
} from "../editor/prepare-export-html";
import {
  extractSlideBlocksForDocxExport,
  extractSlideBlocksForExport,
} from "../materials/slide-html-parser";
import { renderHtmlToPdfBuffer } from "../pdf/html-to-pdf";

export type EditorHtmlExportFormat = "docx" | "pdf" | "html";

export type ExportBodyTarget = "pdf-document" | "pdf-slides" | "docx";

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

/** Prepara o body HTML conforme o tipo de material e o destino da exportação. */
export function resolvePreparedExportBody(
  html: string,
  documentType?: string | null,
  target: ExportBodyTarget = "pdf-document",
): string {
  const kind = detectMaterialExportKind(html, documentType);
  const rawBody = resolveEditorHtmlBody(html);
  const preparedBody = prepareHtmlForExport(rawBody);

  if (kind === "slides") {
    if (target === "pdf-slides") {
      const slideBlocks = extractSlideBlocksForExport(preparedBody);
      return slideBlocks.length ? slideBlocks.join("\n") : preparedBody;
    }

    const slideBlocks = extractSlideBlocksForDocxExport(preparedBody);
    return slideBlocks.length
      ? slideBlocks.join("\n")
      : stripTeacherOnlyExportBlocks(preparedBody);
  }

  if (target === "docx") {
    return stripTeacherOnlyExportBlocks(preparedBody);
  }

  return preparedBody;
}

export function buildEditorExportDocumentHtml(
  title: string,
  html: string,
  documentType?: string | null,
): string {
  const body = resolvePreparedExportBody(html, documentType, "docx");
  return wrapAsPlanifyExportHtml(title, body);
}

export function buildEditorExportHtmlForProfile(
  title: string,
  html: string,
  documentType?: string | null,
): { exportHtml: string; pdfProfile: "document" | "slides" } {
  const kind = detectMaterialExportKind(html, documentType);

  if (kind === "slides") {
    const body = resolvePreparedExportBody(html, documentType, "pdf-slides");
    return { exportHtml: wrapAsSlideExportHtml(title, body), pdfProfile: "slides" };
  }

  const body = resolvePreparedExportBody(html, documentType, "pdf-document");

  return {
    exportHtml: wrapAsPlanifyExportHtml(title, body),
    pdfProfile: "document",
  };
}

export async function exportEditorHtmlDocument(params: {
  title: string;
  html: string;
  format: EditorHtmlExportFormat;
  documentType?: string | null;
}): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  const title = String(params.title || "Documento Planify").trim() || "Documento Planify";
  const body = resolveEditorHtmlBody(params.html);
  const hasText = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length > 0;

  if (!hasText) {
    throw new Error("O documento está vazio. Adicione conteúdo antes de exportar.");
  }

  const { exportHtml, pdfProfile } = buildEditorExportHtmlForProfile(
    title,
    params.html,
    params.documentType,
  );
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
    const preparedBody = resolvePreparedExportBody(
      params.html,
      params.documentType,
      "docx",
    );

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

  const pdfBuffer = await renderHtmlToPdfBuffer(exportHtml, pdfProfile);
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
