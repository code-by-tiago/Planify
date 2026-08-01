import { wrapAsPlanifyExportHtml } from "@/lib/editor/editor-print-html";
import { buildPdfFooterTemplate, renderHtmlToPdfBuffer } from "../pdf/html-to-pdf";

export const VIRAL_FOOTER_TEXT =
  "Gerado em segundos por iaplanify.com.br · Professor, recupere seus finais de semana aqui.";

export async function renderLessonSimulatorPdf(
  title: string,
  bodyHtml: string,
): Promise<Buffer> {
  const wrapped = wrapAsPlanifyExportHtml(title, bodyHtml);
  return renderHtmlToPdfBuffer(wrapped, "document", {
    footerHtml: buildPdfFooterTemplate(VIRAL_FOOTER_TEXT),
  });
}
