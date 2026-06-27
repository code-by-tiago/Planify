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
    if (specifier === "./bncc-suggestion-quality") {
      return loadTsModule("src/server/bncc/bncc-suggestion-quality.ts");
    }
    if (specifier === "./bncc-suggestion-response") {
      return loadTsModule("src/server/bncc/bncc-suggestion-response.ts");
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
    if (specifier.startsWith("@/")) {
      const rel = `src/${specifier.slice(2)}`;
      for (const candidate of [`${rel}.ts`, `${rel}.tsx`]) {
        const full = path.join(root, candidate);
        if (fs.existsSync(full)) {
          return loadTsModule(candidate.replace(/\\/g, "/"));
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
const { applyStageFilterToBnccSuggestionResult } = loadTsModule(
  "src/server/bncc/bncc-suggestion-response.ts",
);
const {
  MIN_SUGGESTION_RELEVANCE_SCORE,
  assessSkillContentCoherence,
} = loadTsModule("src/server/bncc/bncc-suggestion-quality.ts");

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
    minSkills: 5,
  },
  {
    name: "PT EF 5º ano",
    payload: {
      etapa: "Ensino Fundamental",
      anoSerie: "5º ano",
      componenteCurricular: "Língua Portuguesa",
      conteudos: "Orações simples e compostas\nCoesão textual\nProdução de texto narrativo",
    },
    minSkills: 1,
  },
  {
    name: "História EF 5º ano",
    payload: {
      etapa: "Ensino Fundamental",
      anoSerie: "5º ano",
      componenteCurricular: "História",
      conteudos: "Brasil Colônia\nEscravidão\nIndependência do Brasil",
    },
    minSkills: 1,
  },
  {
    name: "Matemática EF 6º ano",
    payload: {
      etapa: "Ensino Fundamental",
      anoSerie: "6º ano",
      componenteCurricular: "Matemática",
      conteudos: "Frações\nNúmeros decimais\nGeometria plana",
    },
    minSkills: 3,
  },
  {
    name: "Ciências EF 4º ano",
    payload: {
      etapa: "Ensino Fundamental",
      anoSerie: "4º ano",
      componenteCurricular: "Ciências",
      conteudos: "Corpo humano\nMateriais e suas propriedades\nSeres vivos",
    },
    minSkills: 1,
  },
];

let failures = 0;

for (const scenario of scenarios) {
  const raw = await suggestBnccByConteudos(scenario.payload);
  const result = applyStageFilterToBnccSuggestionResult(
    raw,
    scenario.payload.etapa,
    scenario.payload.anoSerie,
  );
  const groups = result.conteudos || [];
  const perGroup = groups.map((g) => ({
    conteudo: g.conteudo.slice(0, 45),
    codes: (g.habilidades || []).map((h) => h.codigo),
    skills: g.habilidades || [],
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
  const hasIncoherentSkill = groups.some((group) =>
    (group.habilidades || []).some((skill) => {
      const assessment = assessSkillContentCoherence(group.conteudo, skill, skill.score);
      return !assessment.coherent || assessment.relevanceScore < MIN_SUGGESTION_RELEVANCE_SCORE;
    }),
  );

  console.log(`\n=== ${scenario.name} (source: ${result.source}) ===`);
  for (const g of perGroup) console.log(`  ${g.conteudo} => ${g.codes.join(", ") || "(vazio)"}`);
  console.log(`  unique: ${unique.size}/${allCodes.length}`);
  console.log(`  qualityScore=${result.qualityScore ?? "n/a"}`);

  log({
    hypothesisId: "UNIFIED",
    location: "testar-bncc-escopo",
    message: scenario.name,
    data: {
      source: result.source,
      perGroup,
      uniqueCount: unique.size,
      total: allCodes.length,
      qualityScore: result.qualityScore,
    },
  });

  const minSkills = scenario.minSkills ?? 1;

  if (allCodes.length < minSkills) {
    failures += 1;
    console.log(`  FAIL: menos de ${minSkills} habilidade(s) coerente(s)`);
  } else if (hasWrongGrade) {
    failures += 1;
    console.log("  FAIL: habilidade fora do ano/série");
  } else if (hasIncoherentSkill) {
    failures += 1;
    console.log("  FAIL: habilidade abaixo do score mínimo de coerência");
  }
}

console.log(failures === 0 ? "\nOK: motor unificado passou" : `\nFAIL: ${failures} cenário(s)`);
process.exit(failures === 0 ? 0 : 1);
