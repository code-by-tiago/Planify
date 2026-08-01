import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const moduleCache = new Map();

function loadTsModule(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  if (moduleCache.has(normalized)) return moduleCache.get(normalized);

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
      for (const candidate of [`${resolved}.ts`, `${resolved}.js`]) {
        if (candidate.endsWith(".ts")) {
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
        }
      }
    }
    if (specifier.startsWith("@/")) {
      const resolved = join(root, "src", specifier.slice(2));
      for (const candidate of [`${resolved}.ts`, `${resolved}.tsx`, `${resolved}.js`]) {
        try {
          readFileSync(candidate);
          const rel = candidate.slice(root.length + 1).replace(/\\/g, "/");
          return loadTsModule(rel);
        } catch {
          // continue
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

const { buildOfficialPlanningDocx } = loadTsModule(
  "src/server/planejamentos/official-planning-docx.ts",
);
const { buildOfficialPlanningHtml } = loadTsModule(
  "src/server/planejamentos/official-planning-html.ts",
);
const { convertSimpleDocxToHtml } = loadTsModule(
  "src/server/docx/simple-docx-to-html.ts",
);

const payload = {
  tipoPlanejamento: "anual",
  escola: "Escola Modelo",
  professor: "Prof. Teste",
  etapa: "Ensino Fundamental",
  anoSerie: "5º ano",
  areaConhecimento: "Ciências Humanas",
  componenteCurricular: "História",
  cargaHoraria: "12 períodos",
  matrizPlanejamento: {
    conteudos: [1, 2, 3, 4, 5, 6].map((n, i) => ({
      conteudo: `Conteúdo ${n}`,
      trimestre: Math.min(3, Math.floor(i / 2) + 1),
      numeroAula: i + 1,
      periodos: 1,
      aulaInicio: i + 1,
      aulaFim: i + 1,
      habilidades: [{ codigo: "EF05HI01", descricao: "Habilidade teste" }],
      objetivos: "Objetivo",
      metodologia: "Metodologia",
      recursos: "Recursos",
      avaliacao: "Avaliação",
      evidencias: "Evidências",
    })),
  },
};

const docx = buildOfficialPlanningDocx(payload);
const fromDocx = convertSimpleDocxToHtml(docx, "anual");
const fromTemplate = buildOfficialPlanningHtml(payload);

const count = (html, re) => (html.match(re) || []).length;
const stats = (label, html) => ({
  label,
  length: html.length,
  tables: count(html, /<table/g),
  rows: count(html, /<tr/g),
  mergedHints: count(html, /colspan|rowspan/g),
  hasOfficialClass: html.includes("planify-planning-official"),
  hasStyleBlock: html.includes("<style"),
});

console.log(JSON.stringify(stats("hand-built", fromTemplate), null, 2));
console.log(JSON.stringify(stats("docx-converted", fromDocx), null, 2));

mkdirSync(join(root, "tmp"), { recursive: true });
writeFileSync(join(root, "tmp", "compare-hand.html"), fromTemplate);
writeFileSync(join(root, "tmp", "compare-docx.html"), fromDocx);
