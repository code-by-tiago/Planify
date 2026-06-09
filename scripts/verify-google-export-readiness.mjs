/**
 * Pré-commit: valida motores de exportação Google (offline) e grava debug-f33ae7.log
 * Run: node scripts/verify-google-export-readiness.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOG_PATH = path.join(root, "debug-f33ae7.log");
const require = createRequire(import.meta.url);
const moduleCache = new Map();

function auditLog(hypothesisId, location, message, data = {}) {
  fs.appendFileSync(
    LOG_PATH,
    `${JSON.stringify({
      sessionId: "f33ae7",
      runId: "pre-commit-audit",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    })}\n`,
  );
}

function loadTsModule(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  if (moduleCache.has(normalized)) return moduleCache.get(normalized);

  const ts = require("typescript");
  const sourcePath = path.join(root, relativePath);
  const source = fs.readFileSync(sourcePath, "utf8");
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
      const resolved = path.join(path.dirname(sourcePath), specifier);
      for (const candidate of [`${resolved}.ts`, `${resolved}.js`]) {
        if (candidate.endsWith(".ts")) {
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
        }
      }
    }
    if (specifier.startsWith("@/")) {
      const rel = `src/${specifier.slice(2)}`;
      for (const candidate of [`${rel}.ts`, `${rel}.tsx`]) {
        try {
          fs.readFileSync(path.join(root, candidate));
          return loadTsModule(candidate.replace(/\\/g, "/"));
        } catch {
          /* continue */
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
  evaluator(module.exports, localRequire, module, path.dirname(sourcePath), sourcePath);
  moduleCache.set(normalized, module.exports);
  return module.exports;
}

const SAMPLE_MATRIX = {
  titulo: "Planejamento anual História 5º ano",
  tipoPlanejamento: "anual",
  resumo: "Resumo",
  conteudos: [
    {
      conteudo: "Brasil colonial",
      trimestre: 1,
      habilidades: [{ codigo: "EF05HI01", descricao: "Habilidade teste" }],
      objetivos: "Objetivo",
      metodologia: "Metodologia",
      avaliacao: "Avaliação",
    },
  ],
};

const PAYLOAD_ANUAL = {
  tipoPlanejamento: "anual",
  escola: "Escola Teste",
  professor: "Prof",
  etapa: "Ensino Fundamental",
  anoSerie: "5º ano",
  componenteCurricular: "História",
  cargaHoraria: "80h",
  matrizPlanejamento: SAMPLE_MATRIX,
};

const PAYLOAD_TRIM = {
  ...PAYLOAD_ANUAL,
  tipoPlanejamento: "trimestral",
  trimestre: "1",
};

function main() {
  if (fs.existsSync(LOG_PATH)) fs.unlinkSync(LOG_PATH);

  const { buildOfficialPlanningDocx } = loadTsModule(
    "src/server/planejamentos/official-planning-docx.ts",
  );
  const {
    resolveSlidesExportCompatible,
    resolveSlideDeck,
  } = loadTsModule("src/lib/google/document-type-detection.ts");
  const { buildOfficialPlanningPayloadFromGeneration } = loadTsModule(
    "src/lib/planejamentos/planning-google-export-payload.ts",
  );
  const {
    embedPlanningPayloadInHtml,
    extractPlanningPayloadFromHtml,
  } = loadTsModule("src/lib/planejamentos/planning-export-embed.ts");

  // Hypothesis A: official motor produces valid buffers
  const anualBuf = buildOfficialPlanningDocx(PAYLOAD_ANUAL);
  const trimBuf = buildOfficialPlanningDocx(PAYLOAD_TRIM);
  auditLog("A", "verify-google-export-readiness.mjs", "official docx buffers", {
    anualBytes: anualBuf.length,
    trimBytes: trimBuf.length,
    anualOk: anualBuf.length > 10000,
    trimOk: trimBuf.length > 10000,
  });

  // Hypothesis B/F: missing matrix must throw (no generic fallback for planejamento)
  let missingMatrixThrows = false;
  try {
    buildOfficialPlanningDocx({ tipoPlanejamento: "anual", matrizPlanejamento: { conteudos: [] } });
  } catch (err) {
    missingMatrixThrows = true;
    auditLog("B-F", "verify-google-export-readiness.mjs", "empty matrix rejected", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
  auditLog("B-F", "verify-google-export-readiness.mjs", "missing matrix guard", {
    missingMatrixThrows,
  });

  // Hypothesis C/D: slides compatibility
  const slideHtml = '<div class="planify-slide-deck"><section class="planify-slide"></section></div>';
  const apostilaHtml = "<p>Apostila simples</p>";
  auditLog("C-D", "verify-google-export-readiness.mjs", "slides detection", {
    slidesDeck: resolveSlideDeck(() => slideHtml, "material:slides", false),
    slidesCompatDeck: resolveSlidesExportCompatible(() => slideHtml, "material:slides", false),
    apostilaSlides: resolveSlidesExportCompatible(() => apostilaHtml, "material:apostila", false),
    pdfTypeSlides: resolveSlidesExportCompatible(() => apostilaHtml, "material:pdf", false),
  });

  // Payload builder for client export
  const built = buildOfficialPlanningPayloadFromGeneration({
    tipoPlanejamento: "anual",
    escola: "E",
    professor: "P",
    etapa: "EF",
    anoSerie: "5",
    componenteCurricular: "História",
    cargaHoraria: "80h",
    matrizPlanejamento: SAMPLE_MATRIX,
  });
  auditLog("A", "verify-google-export-readiness.mjs", "payload from generation", {
    hasPayload: Boolean(built),
    hasMatrix: Boolean(built?.matrizPlanejamento),
    tipo: built?.tipoPlanejamento,
  });

  // Hypothesis B: embed/extract for community publish
  const embedded = embedPlanningPayloadInHtml("<p>Planejamento</p>", PAYLOAD_ANUAL);
  const extracted = extractPlanningPayloadFromHtml(embedded);
  auditLog("B", "verify-google-export-readiness.mjs", "planning embed roundtrip", {
    embedded: embedded.includes("planify-planning-export-data"),
    extractedOk: Boolean(extracted?.matrizPlanejamento),
    tipo: extracted?.tipoPlanejamento ?? null,
  });

  // Hypothesis E: scan user-facing DOCX strings in app (not landing)
  const appFiles = [
    "src/app/biblioteca/BibliotecaClient.tsx",
    "src/app/materiais/MateriaisClient.tsx",
    "src/app/planejamentos/PlanejamentosClient.tsx",
  ];
  const docxMentions = [];
  for (const rel of appFiles) {
    const content = fs.readFileSync(path.join(root, rel), "utf8");
    if (/Baixar DOCX|DOCX oficial|baixarWord/i.test(content)) {
      docxMentions.push(rel);
    }
  }
  auditLog("E", "verify-google-export-readiness.mjs", "user-facing docx in core app", {
    filesWithDocxUi: docxMentions,
  });

  const failed =
    anualBuf.length < 10000 ||
    trimBuf.length < 10000 ||
    !missingMatrixThrows ||
    !built?.matrizPlanejamento ||
    !extracted?.matrizPlanejamento ||
    docxMentions.length > 0;

  auditLog("SUMMARY", "verify-google-export-readiness.mjs", failed ? "FAIL" : "PASS", {
    failed,
  });

  if (failed) {
    console.error("verify-google-export-readiness: FAIL — see debug-f33ae7.log");
    process.exit(1);
  }

  console.log("verify-google-export-readiness: PASS");
}

main();
