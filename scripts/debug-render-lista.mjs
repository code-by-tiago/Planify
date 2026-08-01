/**
 * Debug smoke: render lista HTML and log structure (session 0e58e7).
 * Run: node scripts/debug-render-lista.mjs
 */
import { appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logPath = join(root, "debug-0e58e7.log");

function log(payload) {
  appendFileSync(logPath, `${JSON.stringify({ sessionId: "0e58e7", ...payload, timestamp: Date.now() })}\n`);
}

function loadTsModule(relativePath) {
  const ts = require("typescript");
  const sourcePath = join(root, relativePath);
  const source = readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: sourcePath,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier.startsWith("@/")) {
      const rel = `src/${specifier.slice(2)}`;
      for (const candidate of [`${rel}.ts`, `${rel}.tsx`]) {
        try {
          readFileSync(join(root, candidate));
          return loadTsModule(candidate);
        } catch {
          /* next */
        }
      }
    }
    if (specifier.startsWith(".")) {
      const resolved = join(dirname(sourcePath), specifier);
      for (const candidate of [`${resolved}.ts`, `${resolved}.js`]) {
        try {
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
        } catch {
          /* next */
        }
      }
    }
    return require(specifier);
  };
  new Function("exports", "require", "module", "__dirname", "__filename", transpiled)(
    module.exports,
    localRequire,
    module,
    dirname(sourcePath),
    sourcePath,
  );
  return module.exports;
}

const { buildMaterialEngineHtmlFromStructure } = loadTsModule(
  "src/server/materials/material-engine-service.ts",
);

const input = {
  tipoMaterial: "lista",
  tipo: "lista",
  tema: "Frações",
  componenteCurricular: "Matemática",
  anoSerie: "5º ano",
  etapa: "Ensino Fundamental",
  quantidade: 3,
  incluirGabarito: true,
};

const structure = {
  title: "Lista — Frações",
  subtitle: "Matemática • 5º ano",
  summary: "",
  sections: [],
  activities: [],
  teacherNotes: [],
  answerKey: [],
  exam: {
    questions: [
      {
        number: 1,
        type: "multipla-escolha",
        statement: "João comeu 2/8 de uma pizza. Qual fração representa o que sobrou?",
        options: ["a) 6/8", "b) 2/6", "c) 4/8", "d) 8/2"],
        answer: "6/8 — sobraram seis oitavos.",
      },
      {
        number: 2,
        type: "dissertativa",
        statement: "Compare 1/2 e 2/5 usando MMC.",
        options: [],
        answer:
          "1/2 = 5/10 e 2/5 = 4/10; portanto 1/2 é maior. Esta é uma resposta muito longa que deveria ser cortada pelo normalizador para não bagunçar o gabarito visual do professor que só quer a resposta direta sem parágrafos enormes repetindo a explicação inteira da aula.",
      },
      {
        number: 3,
        type: "dissertativa",
        statement: "Simplifique a fração 12/18.",
        options: [],
        answer: "2/3",
      },
    ],
  },
};

const html = buildMaterialEngineHtmlFromStructure(input, structure);

const hasDoublePrefix = /a\)\s*a\)/i.test(html) || /b\)\s*b\)/i.test(html);

log({
  hypothesisId: "H-prefix",
  location: "debug-render-lista.mjs",
  message: "render smoke result",
  data: {
    hasQuestaoCard: html.includes("planify-questao-card"),
    hasGabaritoTable: html.includes("planify-gabarito-table"),
    hasTypeBadge: html.includes("planify-questao-type"),
    hasProfessionalWrap: html.includes("planify-doc-professional"),
    hasDoublePrefix,
    htmlLen: html.length,
  },
});

if (hasDoublePrefix) {
  console.error("FAIL: duplicate option prefix detected in HTML");
  process.exit(1);
}

console.log("OK — see debug-0e58e7.log");
