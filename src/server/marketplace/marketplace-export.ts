import { exportEditorHtmlDocument } from "../export/editor-html-export-service";
import {
  buildMarketplaceExportFilename,
  isMarketplaceHtmlSource,
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
  const filename = buildMarketplaceExportFilename(row.title, format);

  if (format === "html") {
    return {
      buffer: storedBuffer,
      contentType: "text/html; charset=utf-8",
      filename,
    };
  }

  if (!isMarketplaceHtmlSource(row)) {
    if (format === "docx") {
      return {
        buffer: storedBuffer,
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename,
      };
    }

    if (format === "pdf") {
      return {
        buffer: storedBuffer,
        contentType: "application/pdf",
        filename,
      };
    }
  }

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
