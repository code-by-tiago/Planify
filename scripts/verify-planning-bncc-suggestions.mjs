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
    if (specifier === "../ai/gemini-client") {
      return {
        generateGeminiJSON: async () => ({ codigos: [] }),
      };
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
  assessAssertiveSkillCoherence,
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

function assertCatalogStructure(groups, label) {
  for (const group of groups) {
    const catalogo = group.catalogo || [];
    const recomendadas = group.recomendadas || group.habilidades || [];
    const catalogCodes = new Set(catalogo.map((skill) => skill.codigo));

    assert.ok(catalogo.length > 0, `${label}: catalogo vazio para "${group.conteudo.slice(0, 50)}"`);
    assert.ok(
      recomendadas.length <= 10,
      `${label}: recomendadas.length=${recomendadas.length} > 10`,
    );

    for (const skill of recomendadas) {
      assert.ok(
        catalogCodes.has(skill.codigo),
        `${label}: ${skill.codigo} em recomendadas mas fora do catalogo`,
      );
    }
  }
}

function assertCoherence(groups, label, assertive = false) {
  const assess = assertive ? assessAssertiveSkillCoherence : assessSkillContentCoherence;

  for (const group of groups) {
    const skills = group.recomendadas || group.habilidades || [];
    for (const skill of skills) {
      const assessment = assess(group.conteudo, skill, skill.score);
      assert.equal(
        assessment.coherent,
        true,
        `${label}: ${skill.codigo} incoerente (score ${skill.score}) para "${group.conteudo.slice(0, 50)}"`,
      );
      assert.ok(
        assessment.relevanceScore >= MIN_SUGGESTION_RELEVANCE_SCORE ||
          (assertive && assessment.coherent),
        `${label}: score ${assessment.relevanceScore} abaixo do mínimo`,
      );
    }
  }
}

function assertExpectsCode(groups, expectedPrefixes, label) {
  const codes = groups.flatMap((group) =>
    (group.recomendadas || group.habilidades || []).map((skill) => skill.codigo),
  );

  for (const prefix of expectedPrefixes) {
    assert.ok(
      codes.some((code) => code.startsWith(prefix)),
      `${label}: esperava código com prefixo ${prefix}, obteve ${codes.join(", ") || "(vazio)"}`,
    );
  }
}

const assertiveScenarios = [
  {
    name: "LP EM screenshot — conotação e denotação",
    payload: {
      assertiveMode: true,
      etapa: "Ensino Médio",
      anoSerie: "3ª série",
      componenteCurricular: "Língua Portuguesa",
      conteudos: "Conotação e denotação",
    },
    expectSkills: true,
    expectPrefixes: ["EM13LP"],
  },
  {
    name: "LP EM screenshot — variação linguística",
    payload: {
      assertiveMode: true,
      etapa: "Ensino Médio",
      anoSerie: "3ª série",
      componenteCurricular: "Língua Portuguesa",
      conteudos: "Variação Linguística",
    },
    expectSkills: true,
    expectPrefixes: ["EM13LP10"],
  },
  {
    name: "LP EM screenshot — linguagem verbal/não verbal/mista",
    payload: {
      assertiveMode: true,
      etapa: "Ensino Médio",
      anoSerie: "3ª série",
      componenteCurricular: "Língua Portuguesa",
      conteudos: "Linguagem verbal, não verbal e mista",
    },
    expectSkills: true,
    expectPrefixes: ["EM13"],
  },
  {
    name: "PT EM 3ª série (legacy assertive)",
    payload: {
      assertiveMode: true,
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
      assertiveMode: true,
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
      assertiveMode: true,
      etapa: "Ensino Fundamental",
      anoSerie: "6º ano",
      componenteCurricular: "Matemática",
      conteudos: "Frações\nNúmeros decimais\nGeometria plana",
    },
    expectSkills: true,
    expectGrade: 6,
  },
  {
    name: "Matemática EM 3ª série",
    payload: {
      assertiveMode: true,
      etapa: "Ensino Médio",
      anoSerie: "3ª série",
      componenteCurricular: "Matemática",
      conteudos: "Funções exponenciais\nLogaritmos",
    },
    expectSkills: true,
    expectStagePrefix: "EM",
    forbidPrefixes: ["EF"],
  },
  {
    name: "Geografia EF 7º ano",
    payload: {
      assertiveMode: true,
      etapa: "Ensino Fundamental",
      anoSerie: "7º ano",
      componenteCurricular: "Geografia",
      conteudos: "Urbanização\nPopulação\nTerritório brasileiro",
    },
    expectSkills: true,
    expectGrade: 7,
  },
  {
    name: "Ciências EF 8º ano",
    payload: {
      assertiveMode: true,
      etapa: "Ensino Fundamental",
      anoSerie: "8º ano",
      componenteCurricular: "Ciências",
      conteudos: "Genética\nCélulas\nEvolução",
    },
    expectSkills: true,
    expectGrade: 8,
  },
  {
    name: "Cross-contamination guard",
    payload: {
      assertiveMode: true,
      etapa: "Ensino Fundamental",
      anoSerie: "5º ano",
      componenteCurricular: "História",
      conteudos: "Brasil Colônia",
    },
    expectSkills: true,
    forbidPrefixes: ["EF05LP", "EF05MA", "EF05CI"],
  },
  {
    name: "Conteúdo vago",
    payload: {
      assertiveMode: true,
      etapa: "Ensino Fundamental",
      anoSerie: "5º ano",
      componenteCurricular: "Língua Portuguesa",
      conteudos: "Aula genérica sobre conteúdos diversos",
    },
    expectSkills: false,
  },
];

const regressionPayload = {
  etapa: "Ensino Fundamental",
  anoSerie: "5º ano",
  componenteCurricular: "História",
  conteudos: "Brasil Colônia",
};

let failures = 0;

for (const scenario of assertiveScenarios) {
  try {
    const raw = await suggestBnccByConteudos(scenario.payload);
    const result = applyStageFilterToBnccSuggestionResult(
      raw,
      scenario.payload.etapa,
      scenario.payload.anoSerie,
    );
    const groups = result.conteudos || [];
    const allCodes = groups.flatMap((group) =>
      (group.recomendadas || group.habilidades || []).map((skill) => skill.codigo),
    );

    console.log(`\n=== ${scenario.name} ===`);
    for (const group of groups) {
      const catalogCount = (group.catalogo || []).length;
      const recommended = (group.recomendadas || group.habilidades || [])
        .map((skill) => skill.codigo)
        .join(", ");
      console.log(
        `  ${group.conteudo.slice(0, 50)} => catálogo=${catalogCount}, recomendadas=${recommended || "(vazio)"}`,
      );
    }
    console.log(`  qualityScore=${result.qualityScore ?? "n/a"}`);

    if (scenario.expectSkills) {
      assert.ok(allCodes.length > 0, `${scenario.name}: esperava habilidades`);
      assertCatalogStructure(groups, scenario.name);
      assertCoherence(groups, scenario.name, true);
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

      if (scenario.expectPrefixes?.length) {
        assertExpectsCode(groups, scenario.expectPrefixes, scenario.name);
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

      for (const group of groups) {
        for (const skill of group.recomendadas || group.habilidades || []) {
          assert.ok(
            typeof skill.justificativaPedagogica === "string" &&
              skill.justificativaPedagogica.length > 20,
            `${scenario.name}: justificativa ausente em ${skill.codigo}`,
          );
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

try {
  const legacyRaw = await suggestBnccByConteudos(regressionPayload);
  const legacyFiltered = applyStageFilterToBnccSuggestionResult(
    legacyRaw,
    regressionPayload.etapa,
    regressionPayload.anoSerie,
  );
  const legacyCodes = (legacyFiltered.conteudos || []).flatMap((group) =>
    (group.habilidades || []).map((skill) => skill.codigo),
  );

  const assertiveRaw = await suggestBnccByConteudos({
    ...regressionPayload,
    assertiveMode: true,
  });
  const assertiveFiltered = applyStageFilterToBnccSuggestionResult(
    assertiveRaw,
    regressionPayload.etapa,
    regressionPayload.anoSerie,
  );
  const assertiveCodes = (assertiveFiltered.conteudos || []).flatMap((group) =>
    (group.habilidades || []).map((skill) => skill.codigo),
  );

  console.log("\n=== Regressão non-assertive ===");
  console.log(`  legacy=${legacyCodes.join(", ") || "(vazio)"}`);
  console.log(`  assertive=${assertiveCodes.join(", ") || "(vazio)"}`);

  assert.ok(legacyCodes.length > 0, "Regressão: modo padrão deveria sugerir habilidades");
  assert.ok(assertiveCodes.length > 0, "Regressão: modo assertivo deveria sugerir habilidades");

  for (const skill of (legacyFiltered.habilidades || [])) {
    assert.equal(
      skill.justificativaPedagogica,
      undefined,
      "Regressão: modo padrão não deve expor justificativa",
    );
  }

  console.log("  OK");
} catch (error) {
  failures += 1;
  console.error(`  FAIL regressão: ${error instanceof Error ? error.message : String(error)}`);
}

if (failures === 0) {
  console.log("\nOK: verify-planning-bncc passou");
  process.exit(0);
}

console.error(`\nFAIL: ${failures} cenário(s)`);
process.exit(1);
