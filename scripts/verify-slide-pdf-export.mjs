/**
 * Verifica exportação PDF de slides em proporção widescreen.
 * node scripts/verify-slide-pdf-export.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const moduleCache = new Map();

function loadTsModule(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  if (moduleCache.has(normalized)) {
    return moduleCache.get(normalized);
  }

  const ts = require("typescript");
  const sourcePath = join(root, relativePath);
  const source = readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  }).outputText;

  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier.startsWith(".")) {
      const resolved = join(dirname(sourcePath), specifier);
      const candidates = [
        `${resolved}.ts`,
        `${resolved}.js`,
        join(resolved, "index.ts"),
        join(resolved, "index.js"),
      ];

      for (const candidate of candidates) {
        if (candidate.endsWith(".ts")) {
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
        }
      }
    }

    if (specifier.startsWith("@/")) {
      const rel = `src/${specifier.slice(2)}`;
      const candidates = [`${rel}.ts`, `${rel}.tsx`, join(rel, "index.ts")];
      for (const candidate of candidates) {
        const full = join(root, candidate);
        try {
          readFileSync(full);
          return loadTsModule(candidate.replace(/\\/g, "/"));
        } catch {
          // try next
        }
      }
    }

    return require(specifier);
  };

  const evaluator = new Function(
    "exports",
    "require",
    "module",
    "__dirname",
    "__filename",
    transpiled,
  );
  evaluator(module.exports, localRequire, module, dirname(sourcePath), sourcePath);
  moduleCache.set(normalized, module.exports);
  return module.exports;
}

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
  const { buildEditorExportHtmlForProfile, exportEditorHtmlDocument } = loadTsModule(
    "src/server/export/editor-html-export-service.ts",
  );

  const { exportHtml, pdfProfile } = buildEditorExportHtmlForProfile(
    "Teste Slides",
    sampleSlideHtml,
    "material:slides",
  );

  const hasSlideCss = exportHtml.includes("338mm 190mm");
  const hasLastOfTypeBreak = exportHtml.includes(":last-of-type");
  const noA4Portrait = !exportHtml.includes("size: A4 portrait");
  const bodyMatch = exportHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const exportBody = bodyMatch?.[1] ?? "";
  const noDeckWrapper = !/class=["'][^"']*planify-slide-deck/i.test(exportBody);
  const slideOnlyBody = (exportBody.match(/class="planify-slide"/g) || []).length >= 2;

  log("H1", "slide export html profile", {
    pdfProfile,
    hasSlideCss,
    hasLastOfTypeBreak,
    noA4Portrait,
    noDeckWrapper,
    slideOnlyBody,
    pass:
      pdfProfile === "slides" &&
      hasSlideCss &&
      hasLastOfTypeBreak &&
      noDeckWrapper &&
      slideOnlyBody,
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
