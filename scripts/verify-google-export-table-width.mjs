import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const ts = require("typescript");
const LOG_PATH = path.join(root, "debug-f33ae7.log");

function loadTs(relativePath) {
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
    if (specifier === "linkedom") return require("linkedom");
    if (specifier.startsWith(".")) {
      const base = path.join(path.dirname(sourcePath), specifier);
      const candidates = [base, `${base}.ts`, `${base}.js`];
      for (const candidate of candidates) {
        try {
          return require(candidate);
        } catch {
          // try next
        }
      }
      return require(base);
    }
    return require(specifier);
  };

  const runner = new Function(
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
    transpiled,
  );
  runner(module.exports, localRequire, module, sourcePath, path.dirname(sourcePath));
  return module.exports;
}

const { buildPlanningEditorHtml } = loadTs("src/lib/planejamentos/planning-editor-html.ts");
const { buildNativeHtmlDocx } = loadTs("src/server/docx/simple-docx-builder.ts");

const form = {
  escola: "Planify",
  professor: "João",
  etapa: "Ensino Médio",
  anoSerie: "3ª série",
  areaConhecimento: "Linguagens",
  componenteCurricular: "Língua Portuguesa",
  cargaHoraria: "120",
  tipoPlanejamento: "anual",
};

const planning = {
  tipoPlanejamento: "anual",
  titulo: "Teste",
  resumo: "x",
  conteudos: [
    {
      trimestre: 1,
      conteudo: "Sintaxe do período composto",
      habilidades: [{ codigo: "EM13LP08", descricao: "Analisar sintaxe" }],
      objetivos: "Revisar regras",
      metodologia: "Aula expositiva",
      recursos: "Quadro",
      evidencias: "Produção",
      avaliacao: "Observação",
      aulaInicio: 1,
      aulaFim: 10,
    },
  ],
};

const html = buildPlanningEditorHtml(form, planning);
const body = html.replace(/<style[\s\S]*?<\/style>/gi, "").trim();
const buffer = buildNativeHtmlDocx({ title: "documento-planify", htmlBody: body });
const outPath = path.join(root, "tmp/verify-google-export-layout.docx");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, buffer);

const AdmZip = require("adm-zip");
const zip = new AdmZip(buffer);
const docXml = zip.readAsText("word/document.xml");
const tableWidths = [...docXml.matchAll(/<w:tblW w:w="(\d+)"/g)].map((m) => Number(m[1]));
const gridCols = [...docXml.matchAll(/<w:gridCol w:w="(\d+)"/g)].map((m) => Number(m[1]));

const result = {
  file: outPath,
  tableWidths,
  gridCols,
  gridSum: gridCols.reduce((sum, width) => sum + width, 0),
  pageFit: tableWidths.every((width) => width <= 9026),
};

fs.appendFileSync(
  LOG_PATH,
  `${JSON.stringify({
    sessionId: "f33ae7",
    runId: "table-fix-verify",
    hypothesisId: "H-TABLE",
    location: "verify-google-export-table-width.mjs",
    message: "docx table layout verification",
    data: result,
    timestamp: Date.now(),
  })}\n`,
);

console.log(JSON.stringify(result, null, 2));
