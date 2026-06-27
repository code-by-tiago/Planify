/**
 * Golden tests for BNCC suggestion coherence in planejamentos.
 * Run: npm run verify:planning-bncc
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
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
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
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
    if (specifier === "./bncc-stage-filter") {
      return loadTsModule("src/server/bncc/bncc-stage-filter.ts");
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
    module.exports,
    localRequire,
    module,
    path.dirname(sourcePath),
    sourcePath,
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
const { bnccCodeMatchesStage, resolveBnccStageFromFields } = loadTsModule(
  "src/lib/bncc/bncc-stage-filter.ts",
);

function parseFundamentalGrade(code) {
  const match = String(code || "").toUpperCase().match(/^EF(\d)(\d)/);
  if (!match) return null;
  if (match[1] === "0") return Number(match[2]);
  return Number(match[1]);
}

function requestedGrade(anoSerie) {
  return Number(String(anoSerie || "").match(/\d+/)?.[0] || 0);
}

function assertStage(codes, etapa, anoSerie, label) {
  const stage = resolveBnccStageFromFields(etapa, anoSerie);
  for (const code of codes) {
    assert.equal(
      bnccCodeMatchesStage(code, stage),
      true,
      `${label}: ${code} fora da etapa ${etapa}`,
    );
  }
}

function assertGrade(codes, anoSerie, label) {
  const grade = requestedGrade(anoSerie);
  if (!grade) return;

  for (const code of codes) {
    const skillGrade = parseFundamentalGrade(code);
    if (skillGrade === null) continue;
    assert.equal(skillGrade, grade, `${label}: ${code} não pertence ao ${grade}º ano`);
  }
}

function assertNoCrossDiscipline(codes, componente, label) {
  const normalized = String(componente || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  for (const code of codes) {
    if (normalized.includes("historia") && /^EF\d\dLP/.test(code)) {
      assert.fail(`${label}: contaminação LP em História (${code})`);
    }
    if (normalized.includes("matematica") && /^EF\d\dLP/.test(code)) {
      assert.fail(`${label}: contaminação LP em Matemática (${code})`);
    }
    if (normalized.includes("portugues") && /^EF\d\dHI/.test(code)) {
      assert.fail(`${label}: contaminação História em LP (${code})`);
    }
  }
}

function assertCoherence(groups, label) {
  for (const group of groups) {
    for (const skill of group.habilidades || []) {
      const assessment = assessSkillContentCoherence(group.conteudo, skill, skill.score);
      assert.equal(
        assessment.coherent,
        true,
        `${label}: ${skill.codigo} incoerente (score ${skill.score}) para "${group.conteudo.slice(0, 50)}"`,
      );
      assert.ok(
        assessment.relevanceScore >= MIN_SUGGESTION_RELEVANCE_SCORE,
        `${label}: score ${assessment.relevanceScore} abaixo do mínimo`,
      );
    }
  }
}

const scenarios = [
  {
    name: "PT EM 3ª série",
    payload: {
      etapa: "Ensino Médio",
      anoSerie: "3ª série",
      componenteCurricular: "Língua Portuguesa",
      conteudos: [
        "Coesão e coerência textuais",
        "Estrutura Dissertativa-Argumentativa",
        "Competências do ENEM: Domínio da norma-padrão e proposta de intervenção detalhada",
      ].join("\n"),
    },
    expectSkills: true,
    expectStagePrefix: "EM",
  },
  {
    name: "História EF 5º ano",
    payload: {
      etapa: "Ensino Fundamental",
      anoSerie: "5º ano",
      componenteCurricular: "História",
      conteudos: "Brasil Colônia\nEscravidão\nIndependência do Brasil",
    },
    expectSkills: true,
    expectGrade: 5,
  },
  {
    name: "Matemática EF 6º ano",
    payload: {
      etapa: "Ensino Fundamental",
      anoSerie: "6º ano",
      componenteCurricular: "Matemática",
      conteudos: "Frações\nNúmeros decimais\nGeometria plana",
    },
    expectSkills: true,
    expectGrade: 6,
  },
  {
    name: "Cross-contamination guard",
    payload: {
      etapa: "Ensino Fundamental",
      anoSerie: "5º ano",
      componenteCurricular: "História",
      conteudos: "Brasil Colônia",
    },
    expectSkills: true,
    forbidPrefixes: ["EF05LP", "EF05MA", "EF05CI"],
  },
  {
    name: "Generic content",
    payload: {
      etapa: "Ensino Fundamental",
      anoSerie: "5º ano",
      componenteCurricular: "Língua Portuguesa",
      conteudos: "Aula genérica sobre conteúdos diversos",
    },
    expectSkills: false,
  },
];

let failures = 0;

for (const scenario of scenarios) {
  try {
    const raw = await suggestBnccByConteudos(scenario.payload);
    const result = applyStageFilterToBnccSuggestionResult(
      raw,
      scenario.payload.etapa,
      scenario.payload.anoSerie,
    );
    const groups = result.conteudos || [];
    const allCodes = groups.flatMap((group) =>
      (group.habilidades || []).map((skill) => skill.codigo),
    );

    console.log(`\n=== ${scenario.name} ===`);
    for (const group of groups) {
      const codes = (group.habilidades || []).map((skill) => skill.codigo).join(", ");
      console.log(`  ${group.conteudo.slice(0, 50)} => ${codes || "(vazio)"}`);
    }
    console.log(`  qualityScore=${result.qualityScore ?? "n/a"}`);

    if (scenario.expectSkills) {
      assert.ok(allCodes.length > 0, `${scenario.name}: esperava habilidades`);
      assertCoherence(groups, scenario.name);
      assertStage(
        allCodes,
        scenario.payload.etapa,
        scenario.payload.anoSerie,
        scenario.name,
      );
      assertNoCrossDiscipline(
        allCodes,
        scenario.payload.componenteCurricular,
        scenario.name,
      );

      if (scenario.expectGrade) {
        assertGrade(allCodes, scenario.payload.anoSerie, scenario.name);
      }

      if (scenario.expectStagePrefix) {
        for (const code of allCodes) {
          assert.ok(
            code.startsWith(scenario.expectStagePrefix),
            `${scenario.name}: ${code} não começa com ${scenario.expectStagePrefix}`,
          );
        }
      }

      if (scenario.forbidPrefixes?.length) {
        for (const code of allCodes) {
          for (const prefix of scenario.forbidPrefixes) {
            assert.notEqual(
              code.slice(0, prefix.length),
              prefix,
              `${scenario.name}: código proibido ${code}`,
            );
          }
        }
      }
    } else {
      assert.equal(allCodes.length, 0, `${scenario.name}: não deveria sugerir habilidades genéricas`);
    }

    console.log(`  OK`);
  } catch (error) {
    failures += 1;
    console.error(`  FAIL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures === 0) {
  console.log("\nOK: verify-planning-bncc passou");
  process.exit(0);
}

console.error(`\nFAIL: ${failures} cenário(s)`);
process.exit(1);
