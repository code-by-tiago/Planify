import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { createCanvas } from "@napi-rs/canvas";

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

const requireFromHere = createRequire(import.meta.url);

const MAX_PAGES_DEFAULT = 20;
const RENDER_SCALE = 1.75;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadPdfJs(): Promise<PdfJsModule> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
    requireFromHere.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs"),
  ).toString();
  return pdfjs;
}

/**
 * Converte PDF em HTML do Editor com páginas rasterizadas (máxima fidelidade visual).
 * Cada página vira uma imagem; o professor pode anotar abaixo de cada página.
 */
export async function convertPdfToEditorHtml(
  buffer: Buffer,
  title = "Material PDF",
  options?: { maxPages?: number },
): Promise<{ html: string; pageCount: number }> {
  const pdfjs = await loadPdfJs();
  const maxPages = Math.max(1, options?.maxPages ?? MAX_PAGES_DEFAULT);

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    disableWorker: true,
    useSystemFonts: true,
  } as unknown as Parameters<PdfJsModule["getDocument"]>[0]);

  const pdf = await loadingTask.promise;
  const pageLimit = Math.min(pdf.numPages, maxPages);
  const sections: string[] = [];

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const width = Math.ceil(viewport.width);
    const height = Math.ceil(viewport.height);
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    await page.render({
      canvasContext: context as unknown as CanvasRenderingContext2D,
      canvas: canvas as unknown as HTMLCanvasElement,
      viewport,
    }).promise;

    const pngBuffer = canvas.toBuffer("image/png");
    const dataUrl = `data:image/png;base64,${pngBuffer.toString("base64")}`;

    sections.push(`
      <section class="planify-pdf-page" data-page="${pageNumber}" contenteditable="false">
        <figure class="planify-pdf-page-figure" contenteditable="false">
          <img src="${dataUrl}" alt="Página ${pageNumber} — ${escapeHtml(title)}" style="width:100%;height:auto;display:block;" />
        </figure>
        <div class="planify-pdf-page-notes" contenteditable="true">
          <p><br></p>
        </div>
      </section>
      ${pageNumber < pageLimit ? '<hr class="page-break" />' : ""}
    `.trim());
  }

  const truncatedNote =
    pdf.numPages > pageLimit
      ? `<p class="planify-pdf-import-note" style="color:#64748b;font-size:12px;">Prévia das primeiras ${pageLimit} de ${pdf.numPages} páginas. Baixe o PDF original para o arquivo completo.</p>`
      : "";

  const html = `
    <article class="planify-doc planify-pdf-import" data-source-pdf="1" data-page-count="${pageLimit}">
      <h1>${escapeHtml(title)}</h1>
      ${truncatedNote}
      ${sections.join("\n")}
    </article>
  `.trim();

  return { html, pageCount: pageLimit };
}
