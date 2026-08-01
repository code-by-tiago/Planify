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
    if (specifier.startsWith("@/")) {
      const mapped = path.join(root, "src", specifier.slice(2));
      for (const candidate of [mapped, `${mapped}.ts`, `${mapped}.js`]) {
        try {
          return require(candidate);
        } catch {
          // continue
        }
      }
    }
    if (specifier.startsWith(".")) {
      const base = path.join(path.dirname(sourcePath), specifier);
      for (const candidate of [base, `${base}.ts`, `${base}.js`]) {
        try {
          return require(candidate);
        } catch {
          // continue
        }
      }
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
const { buildOfficialPlanningPayloadFromEditorMeta } = loadTs(
  "src/lib/planejamentos/planning-google-export-payload.ts",
);
const { buildNativeHtmlDocx } = loadTs("src/server/docx/simple-docx-builder.ts");
const { buildOfficialPlanningDocx } = loadTs(
  "src/server/planejamentos/official-planning-docx.ts",
);

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
  titulo: "Plano anual",
  resumo: "Resumo",
  conteudos: Array.from({ length: 4 }, (_, index) => ({
    trimestre: 1,
    conteudo: `Conteúdo ${index + 1}`,
    habilidades: [{ codigo: "EM13LP08", descricao: "Analisar sintaxe do português" }],
    objetivos: "Expectativa de aprendizagem detalhada para o trimestre",
    metodologia: "Oficina de escrita",
    recursos: "Quadro",
    evidencias: "Produção textual",
    avaliacao: "Prova individual com exercícios de transformação de orações",
    aulaInicio: index * 10 + 1,
    aulaFim: (index + 1) * 10,
  })),
};

const meta = {
  etapa: form.etapa,
  anoSerie: form.anoSerie,
  componente: form.componenteCurricular,
  tipoPlanejamento: "anual",
  generationPayload: {
    ...form,
    componenteCurricular: form.componenteCurricular,
    tipoPlanejamento: "anual",
  },
  matrizPlanejamento: planning,
};

const payload = buildOfficialPlanningPayloadFromEditorMeta(meta);
const html = buildPlanningEditorHtml(form, planning);
const htmlBuffer = buildNativeHtmlDocx({
  title: "documento-planify",
  htmlBody: html.replace(/<style[\s\S]*?<\/style>/gi, "").trim(),
});
const officialBuffer = payload ? buildOfficialPlanningDocx(payload) : null;

const result = {
  hasPayload: Boolean(payload),
  htmlBytes: htmlBuffer.byteLength,
  officialBytes: officialBuffer?.byteLength ?? 0,
  officialEngine: officialBuffer ? "buildOfficialPlanningDocx" : null,
};

fs.appendFileSync(
  LOG_PATH,
  `${JSON.stringify({
    sessionId: "f33ae7",
    runId: "planning-google-export-verify",
    hypothesisId: "H-OFFICIAL",
    location: "verify-planning-google-export.mjs",
    message: "planning export path comparison",
    data: result,
    timestamp: Date.now(),
  })}\n`,
);

console.log(JSON.stringify(result, null, 2));
