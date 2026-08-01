/**
 * Diagnóstico BNCC — Português EM 3ª série
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url);
const LOG = path.join(root, "debug-f33ae7.log");

function log(data) {
  fs.appendFileSync(
    LOG,
    `${JSON.stringify({ sessionId: "f33ae7", runId: "bncc-pt-em", ...data, timestamp: Date.now() })}\n`,
  );
}

const bnccJsonPath = path.join(root, "data/bncc/processado/bncc-habilidades.json");
const bnccSkills = JSON.parse(fs.readFileSync(bnccJsonPath, "utf8"));

const moduleCache = new Map();

function loadTsModule(relativePath) {
  if (moduleCache.has(relativePath)) {
    return moduleCache.get(relativePath);
  }

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
    if (specifier === "server-only") {
      return {};
    }

    if (specifier === "./bncc-catalog-service") {
      return {
        getCachedBnccSkills: async () => bnccSkills,
        fetchBnccSkillsFromDb: async () => bnccSkills,
        countBnccSkillsInDb: async () => bnccSkills.length,
      };
    }
    if (specifier === "./bncc-service") {
      return loadTsModule("src/server/bncc/bncc-service.ts");
    }
    if (specifier === "./discipline-catalog") {
      return loadTsModule("src/server/bncc/discipline-catalog.ts");
    }
    if (specifier === "./bncc-term-expansion") {
      return loadTsModule("src/server/bncc/bncc-term-expansion.ts");
    }

    if (specifier.startsWith(".")) {
      const resolved = path.join(path.dirname(sourcePath), specifier);

      for (const candidate of [`${resolved}.ts`, `${resolved}.js`]) {
        if (fs.existsSync(candidate) && candidate.endsWith(".ts")) {
          const rel = path.relative(root, candidate).replace(/\\/g, "/");
          return loadTsModule(rel);
        }
      }
    }

    return require(specifier);
  };

  new Function("exports", "require", "module", "__dirname", "__filename", transpiled)(
    module.exports,
    localRequire,
    module,
    path.dirname(sourcePath),
    sourcePath,
  );

  moduleCache.set(relativePath, module.exports);
  return module.exports;
}

const conteudos = [
  "REVISÃO: Semântica e Sintaxe: Sintaxe do período composto, regência e crase, e colocação pronominal",
  "Orações coordenadas",
  "Orações subordinadas - adverbiais, substantivas e adjetivas",
  "Orações reduzidas",
  "Coesão e coerência textuais",
  "Tipos de texto: descrição, narração e dissertação",
  "Estrutura Dissertativa-Argumentativa: Introdução com tese, desenvolvimento e conclusão",
  "Competências do ENEM: Domínio da norma-padrão e proposta de intervenção detalhada",
  "Repertório Sociocultural: Uso de dados, filosofia, história e literatura nos argumentos",
];

const payload = {
  etapa: "Ensino Médio",
  anoSerie: "3ª série",
  areaConhecimento: "Linguagens e suas Tecnologias",
  componenteCurricular: "Língua Portuguesa",
  conteudos: conteudos.join("\n"),
};

const { suggestBnccByConteudos } = loadTsModule("src/server/bncc/bncc-suggestion-engine.ts");

const result = await suggestBnccByConteudos(payload);

for (const group of result.conteudos || []) {
  const codes = (group.habilidades || []).map((h) => h.codigo);
  log({
    hypothesisId: "H1",
    location: "testar-bncc",
    message: "group skills",
    data: {
      conteudo: group.conteudo.slice(0, 60),
      codes,
      sources: group.habilidades.map((h) => h.source),
    },
  });
  console.log(group.conteudo.slice(0, 55), "=>", codes.join(", "));
}

const allCodes = (result.conteudos || []).flatMap((g) => g.habilidades.map((h) => h.codigo));
const unique = new Set(allCodes);
console.log("UNIQUE_CODES", unique.size, Array.from(unique));
console.log("SOURCE", result.source);
