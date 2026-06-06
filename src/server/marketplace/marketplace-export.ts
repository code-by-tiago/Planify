import { exportEditorHtmlDocument } from "../export/editor-html-export-service";
import {
  buildMarketplaceDownloadFilename,
  buildMarketplaceExportFilename,
  isMarketplaceHtmlSource,
  resolveMarketplaceDownloadMime,
  resolveMarketplaceStoredKind,
  type MarketplaceExportFormat,
} from "./marketplace-download";

type MarketplaceExportRow = {
  title: string;
  file_name?: string | null;
  file_mime?: string | null;
};

export async function buildMarketplaceExportBuffer(params: {
  format: MarketplaceExportFormat;
  row: MarketplaceExportRow;
  storedBuffer: Buffer;
}): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  const { format, row, storedBuffer } = params;
  const kind = resolveMarketplaceStoredKind(row);

  if (format === "html") {
    return {
      buffer: storedBuffer,
      contentType: isMarketplaceHtmlSource(row)
        ? "text/html; charset=utf-8"
        : resolveMarketplaceDownloadMime(row),
      filename: buildMarketplaceDownloadFilename(row.file_name, row.title),
    };
  }

  if (kind === "html") {
    const html = storedBuffer.toString("utf-8");
    const exported = await exportEditorHtmlDocument({
      title: row.title,
      html,
      format: format === "pdf" ? "pdf" : "docx",
    });

    return {
      buffer: exported.buffer,
      contentType: exported.contentType,
      filename: exported.filename,
    };
  }

  if (kind === "pdf") {
    if (format === "pdf") {
      return {
        buffer: storedBuffer,
        contentType: "application/pdf",
        filename: buildMarketplaceExportFilename(row.title, "pdf"),
      };
    }

    throw new Error(
      "Este material foi publicado em PDF. Use o botão Baixar PDF.",
    );
  }

  if (kind === "docx") {
    if (format === "docx") {
      return {
        buffer: storedBuffer,
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename: buildMarketplaceExportFilename(row.title, "docx"),
      };
    }

    throw new Error(
      "Este material foi publicado em DOCX. Use o botão Baixar DOCX.",
    );
  }

  const filename = buildMarketplaceDownloadFilename(row.file_name, row.title);

  if (format === "pdf" && !filename.toLowerCase().endsWith(".pdf")) {
    throw new Error(
      "Este anexo não está em PDF. Baixe o formato original (DOCX) ou peça ao autor uma versão PDF.",
    );
  }

  if (format === "docx" && !/\.docx?$/i.test(filename)) {
    throw new Error(
      "Este anexo não está em DOCX. Baixe o formato disponível ou peça ao autor uma versão DOCX.",
    );
  }

  return {
    buffer: storedBuffer,
    contentType: resolveMarketplaceDownloadMime(row),
    filename,
  };
}
