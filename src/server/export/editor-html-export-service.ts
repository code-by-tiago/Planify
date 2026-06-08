import { MAX_EXPORT_FILE_BYTES } from "@/lib/ai/material-generation-policy";
import { detectMaterialExportKind } from "@/lib/export/classroom-export-format";
import {
  wrapAsPlanifyExportHtml,
  wrapAsSlideExportHtml,
} from "../../lib/editor/editor-print-html";
import { buildNativeHtmlDocx } from "../docx/simple-docx-builder";
import { extractBodyHtml } from "../editor/html-inner-text";
import { prepareHtmlForExport } from "../editor/prepare-export-html";
import { extractSlideBlocks, extractSlideBlocksForExport } from "../materials/slide-html-parser";
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

export function buildEditorExportHtmlForProfile(
  title: string,
  html: string,
  documentType?: string | null,
): { exportHtml: string; pdfProfile: "document" | "slides" } {
  const kind = detectMaterialExportKind(html, documentType);
  const rawBody = resolveEditorHtmlBody(html);
  const preparedBody = prepareHtmlForExport(rawBody);

  if (kind === "slides") {
    const slideBlocks = extractSlideBlocksForExport(preparedBody);
    const body = slideBlocks.length ? slideBlocks.join("\n") : preparedBody;

    // #region agent log
    fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "1b39d8",
      },
      body: JSON.stringify({
        sessionId: "1b39d8",
        runId: "pdf-export",
        hypothesisId: "H2",
        location: "editor-html-export-service.ts:buildEditorExportHtmlForProfile",
        message: "slide export body composed",
        data: {
          slideBlockCount: slideBlocks.length,
          rawSlideCount: extractSlideBlocks(preparedBody).length,
          hasDeckWrapper: /planify-slide-deck/i.test(preparedBody),
          hasTeacherNotes: /Notas do professor/i.test(preparedBody),
          bodyUsesOnlySlides: slideBlocks.length > 0,
          exportBodyHasDeck: /planify-slide-deck/i.test(body),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return { exportHtml: wrapAsSlideExportHtml(title, body), pdfProfile: "slides" };
  }

  return {
    exportHtml: wrapAsPlanifyExportHtml(title, preparedBody),
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

  // #region agent log
  fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "1b39d8",
    },
    body: JSON.stringify({
      sessionId: "1b39d8",
      runId: "pdf-export",
      hypothesisId: "H4",
      location: "editor-html-export-service.ts:exportEditorHtmlDocument",
      message: "export profile resolved",
      data: {
        format: params.format,
        pdfProfile,
        documentType: params.documentType ?? null,
        materialKind: detectMaterialExportKind(params.html, params.documentType),
        usesSlideWrapper: pdfProfile === "slides",
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

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
