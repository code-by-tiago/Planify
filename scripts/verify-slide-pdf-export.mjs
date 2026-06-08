/**
 * Verifica exportação PDF de slides em proporção widescreen.
 * node scripts/verify-slide-pdf-export.mjs
 */
import fs from "node:fs";
import path from "node:path";

const LOG = path.join(process.cwd(), "debug-1b39d8.log");
const ENDPOINT = "http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281";

function log(hypothesisId, message, data) {
  const entry = {
    sessionId: "1b39d8",
    runId: "verify-slide-pdf",
    hypothesisId,
    location: "scripts/verify-slide-pdf-export.mjs",
    message,
    data,
    timestamp: Date.now(),
  };
  fs.appendFileSync(LOG, `${JSON.stringify(entry)}\n`);
  fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "1b39d8",
    },
    body: JSON.stringify(entry),
  }).catch(() => {});
  console.log(`[${hypothesisId}] ${message}`, JSON.stringify(data));
}

const sampleSlideHtml = `
<section class="planify-slide-deck" data-planify-slide-theme="moderno">
  <p>Apresentação · 2 slides · Tema moderno</p>
  <div class="planify-slide" style="padding:24px;background:#fff;">
    <h3>Slide 1</h3>
    <ul><li>Item A</li><li>Item B</li></ul>
  </div>
  <div class="planify-slide" style="padding:24px;background:#fff;">
    <h3>Slide 2</h3>
    <ul><li>Item C</li></ul>
  </div>
</section>`;

async function main() {
  const { buildEditorExportHtmlForProfile, exportEditorHtmlDocument } =
    await import("../src/server/export/editor-html-export-service.ts");

  const { exportHtml, pdfProfile } = buildEditorExportHtmlForProfile(
    "Teste Slides",
    sampleSlideHtml,
    "material:slides",
  );

  const hasSlideCss = exportHtml.includes("338mm 190mm");
  const hasSlidePageBreak = exportHtml.includes("page-break-after: always");
  const noA4Portrait = !exportHtml.includes("size: A4 portrait");

  log("H1", "slide export html profile", {
    pdfProfile,
    hasSlideCss,
    hasSlidePageBreak,
    noA4Portrait,
    pass: pdfProfile === "slides" && hasSlideCss && hasSlidePageBreak,
  });

  try {
    const exported = await exportEditorHtmlDocument({
      title: "Teste Slides",
      html: sampleSlideHtml,
      format: "pdf",
      documentType: "material:slides",
    });

    log("H2", "slide pdf generated", {
      filename: exported.filename,
      contentType: exported.contentType,
      pdfBytes: exported.buffer.byteLength,
      pass: exported.buffer.byteLength > 1000,
    });
  } catch (error) {
    log("H2", "slide pdf generation failed", {
      error: error instanceof Error ? error.message : String(error),
      pass: false,
    });
    process.exit(1);
  }

  process.exit(0);
}

main();
