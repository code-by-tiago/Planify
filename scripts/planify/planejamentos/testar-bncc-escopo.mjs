/**
 * Diagnóstico BNCC — escopo multi-etapa/disciplina (motor unificado)
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
    `${JSON.stringify({ sessionId: "f33ae7", runId: "bncc-unified", ...data, timestamp: Date.now() })}\n`,
  );
}

const bnccSkills = JSON.parse(
  fs.readFileSync(path.join(root, "data/bncc/processado/bncc-habilidades.json"), "utf8"),
);
const moduleCache = new Map();

function loadTsModule(relativePath) {
  if (moduleCache.has(relativePath)) return moduleCache.get(relativePath);

  const ts = require("typescript");
  const sourcePath = path.join(root, relativePath);
  const source = fs.readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: sourcePath,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier === "server-only") return {};
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
          return loadTsModule(path.relative(root, candidate).replace(/\\/g, "/"));
        }
      }
    }
    return require(specifier);
  };
  new Function("exports", "require", "module", "__dirname", "__filename", transpiled)(
    module.exports, localRequire, module, path.dirname(sourcePath), sourcePath,
  );
  moduleCache.set(relativePath, module.exports);
  return module.exports;
}

const { suggestBnccByConteudos } = loadTsModule("src/server/bncc/bncc-suggestion-engine.ts");

const scenarios = [
  {
    name: "PT EM 3ª série (9 tópicos)",
    payload: {
      etapa: "Ensino Médio",
      anoSerie: "3ª série",
      componenteCurricular: "Língua Portuguesa",
      conteudos: [
        "REVISÃO: Semântica e Sintaxe: Sintaxe do período composto, regência e crase, e colocação pronominal",
        "Orações coordenadas",
        "Orações subordinadas - adverbiais, substantivas e adjetivas",
        "Orações reduzidas",
        "Coesão e coerência textuais",
        "Tipos de texto: descrição, narração e dissertação",
        "Estrutura Dissertativa-Argumentativa: Introdução com tese, desenvolvimento e conclusão",
        "Competências do ENEM: Domínio da norma-padrão e proposta de intervenção detalhada",
        "Repertório Sociocultural: Uso de dados, filosofia, história e literatura nos argumentos",
      ].join("\n"),
    },
  },
  {
    name: "PT EF 5º ano",
    payload: {
      etapa: "Ensino Fundamental",
      anoSerie: "5º ano",
      componenteCurricular: "Língua Portuguesa",
      conteudos: "Orações simples e compostas\nCoesão textual\nProdução de texto narrativo",
    },
  },
  {
    name: "História EF 5º ano",
    payload: {
      etapa: "Ensino Fundamental",
      anoSerie: "5º ano",
      componenteCurricular: "História",
      conteudos: "Brasil Colônia\nEscravidão\nIndependência do Brasil",
    },
  },
  {
    name: "Matemática EF 6º ano",
    payload: {
      etapa: "Ensino Fundamental",
      anoSerie: "6º ano",
      componenteCurricular: "Matemática",
      conteudos: "Frações\nNúmeros decimais\nGeometria plana",
    },
  },
  {
    name: "Ciências EF 4º ano",
    payload: {
      etapa: "Ensino Fundamental",
      anoSerie: "4º ano",
      componenteCurricular: "Ciências",
      conteudos: "Corpo humano\nMateriais e suas propriedades\nSeres vivos",
    },
  },
];

let failures = 0;

for (const scenario of scenarios) {
  const result = await suggestBnccByConteudos(scenario.payload);
  const perGroup = (result.conteudos || []).map((g) => ({
    conteudo: g.conteudo.slice(0, 45),
    codes: g.habilidades.map((h) => h.codigo),
  }));
  const allCodes = perGroup.flatMap((g) => g.codes);
  const unique = new Set(allCodes);
  const hasWrongGrade = perGroup.some((g) =>
    g.codes.some((code) => {
      const m = code.match(/^EF(\d)(\d)/);
      if (!m) return false;
      const grade = m[1] === "0" ? Number(m[2]) : Number(m[1]);
      const payloadGrade = Number(scenario.payload.anoSerie.match(/\d+/)?.[0] || 0);
      return payloadGrade && grade !== payloadGrade && !(m[1] !== "0" && grade <= Number(m[2]) && payloadGrade >= grade && payloadGrade <= Number(m[2]));
    }),
  );

  console.log(`\n=== ${scenario.name} (source: ${result.source}) ===`);
  for (const g of perGroup) console.log(`  ${g.conteudo} => ${g.codes.join(", ") || "(vazio)"}`);
  console.log(`  unique: ${unique.size}/${allCodes.length}`);

  log({
    hypothesisId: "UNIFIED",
    location: "testar-bncc-escopo",
    message: scenario.name,
    data: { source: result.source, perGroup, uniqueCount: unique.size, total: allCodes.length },
  });

  if (allCodes.length === 0 || unique.size < Math.min(3, perGroup.length)) {
    failures += 1;
    console.log("  FAIL: poucas habilidades distintas");
  }
}

console.log(failures === 0 ? "\nOK: motor unificado passou" : `\nFAIL: ${failures} cenário(s)`);
process.exit(failures === 0 ? 0 : 1);
