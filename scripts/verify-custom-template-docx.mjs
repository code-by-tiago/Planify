/**
 * Verificação — planejamentos usam SOMENTE modelos oficiais anual/trimestral.
 * Run: npm run verify:custom-template-docx
 */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = join(root, "tmp", "verify-custom-template-final");
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
      const rel = `src/${specifier.slice(2)}`;
      for (const candidate of [`${rel}.ts`, `${rel}.tsx`]) {
        try {
          readFileSync(join(root, candidate));
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

function buildPayload(tipo, trimestre = 1) {
  const habilidades = [
    { codigo: "EF05HI01", descricao: "Identificar processos de formação das culturas." },
    { codigo: "EF05HI02", descricao: "Identificar mecanismos de organização do poder." },
  ];
  const conteudos =
    tipo === "anual"
      ? ["Povos originários", "Colonização", "Independência"]
      : ["Povos originários", "Colonização"];
  const matrix = conteudos.map((conteudo, index) => ({
    conteudo,
    trimestre,
    aulaInicio: index * 2 + 1,
    aulaFim: index * 2 + 2,
    habilidades: [habilidades[index % habilidades.length]],
    objetivos: `Compreender ${conteudo.toLowerCase()}.`,
    metodologia: "Aula dialogada.",
    recursos: "Livro didático.",
    avaliacao: "Participação.",
    evidencias: "Registros.",
  }));

  return {
    tipoPlanejamento: tipo,
    escola: "Escola Verificação Planify",
    professor: "Prof. Verificação",
    etapa: "Ensino Fundamental",
    anoSerie: "5º ano",
    componenteCurricular: "História",
    cargaHoraria: "60 aulas",
    trimestre: String(trimestre),
    conteudos,
    matrizPlanejamento: {
      tipoPlanejamento: tipo,
      titulo: `Verificação ${tipo}`,
      resumo: "verify",
      conteudos: matrix,
    },
  };
}

function assertDocx(label, buffer, minBytes = 1000) {
  assert.ok(Buffer.isBuffer(buffer), `${label}: buffer inválido`);
  assert.ok(buffer.byteLength >= minBytes, `${label}: DOCX pequeno (${buffer.byteLength})`);
  assert.equal(buffer.subarray(0, 2).toString("utf8"), "PK", `${label}: não é ZIP`);
}

function main() {
  const { buildOfficialPlanningDocx } = loadTsModule(
    "src/server/planejamentos/official-planning-docx.ts",
  );
  const { buildPlanningDocx } = loadTsModule(
    "src/server/planejamentos/planning-docx-service.ts",
  );

  mkdirSync(outputDir, { recursive: true });

  const officialAnual = buildOfficialPlanningDocx(buildPayload("anual"));
  const officialTrim = buildOfficialPlanningDocx(buildPayload("trimestral", 1));
  assertDocx("official-anual", officialAnual, 30000);
  assertDocx("official-trimestral", officialTrim, 30000);

  const viaService = buildPlanningDocx(buildPayload("anual"));
  assertDocx("service-official", viaService.buffer, 30000);
  assert.equal(viaService.filename.includes("anual"), true);

  const anualPath = join(root, "data", "modelos-oficiais", "modelo-anual.docx");
  const trimPath = join(root, "data", "modelos-oficiais", "modelo-trimestral.docx");
  assert.ok(readFileSync(anualPath).byteLength > 1000, "modelo-anual.docx presente");
  assert.ok(readFileSync(trimPath).byteLength > 1000, "modelo-trimestral.docx presente");

  writeFileSync(join(outputDir, "official-anual.docx"), officialAnual);
  writeFileSync(join(outputDir, "official-trimestral.docx"), officialTrim);

  console.log("verify-custom-template-docx: modelos oficiais apenas — OK");
}

main();
