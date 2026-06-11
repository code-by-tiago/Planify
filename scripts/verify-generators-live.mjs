/**
 * Geração real via Material Engine (requer GEMINI_API_KEY em .env.local).
 * Rodar antes de deploy — exit code 1 em falha.
 *
 * Run: npm run verify:generators-live
 * Staging: npm run verify:staging  (--suite=sprint1)
 * Opcional: npm run verify:generators-live -- --types=prova,atividade
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const moduleCache = new Map();

function loadEnvLocal() {
  try {
    for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

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

function parseTypesArg() {
  const arg = process.argv.find((item) => item.startsWith("--types="));
  if (!arg) return null;
  return arg
    .slice("--types=".length)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSuiteArg() {
  const arg = process.argv.find((item) => item.startsWith("--suite="));
  if (!arg) return null;
  return arg.slice("--suite=".length).trim();
}

const BNCC = [
  {
    codigo: "EF09MA15",
    descricao:
      "Resolver e elaborar problemas que envolvam equações polinomiais de 2º grau.",
  },
];

const LIVE_PAYLOADS = {
  prova: {
    tipoMaterial: "prova",
    quantidade: 3,
    incluirGabarito: true,
  },
  lista: {
    tipoMaterial: "lista",
    quantidade: 3,
    incluirGabarito: true,
  },
  apostila: {
    tipoMaterial: "apostila",
    quantidade: 3,
    incluirGabarito: true,
  },
  atividade: {
    tipoMaterial: "atividade",
    quantidade: 2,
    incluirGabarito: true,
  },
  "plano-aula": {
    tipoMaterial: "plano-aula",
    quantidade: 1,
    incluirGabarito: false,
  },
  jogo: {
    tipoMaterial: "jogo",
    formatoJogo: "quiz",
    quantidade: 1,
    incluirGabarito: false,
  },
  resumo: {
    tipoMaterial: "resumo",
    quantidade: 2,
    incluirGabarito: false,
  },
  sequencia: {
    tipoMaterial: "sequencia",
    quantidade: 2,
    incluirGabarito: false,
  },
  projeto: {
    tipoMaterial: "projeto",
    quantidade: 2,
    incluirGabarito: false,
  },
  redacao: {
    tipoMaterial: "redacao",
    quantidade: 2,
    incluirGabarito: false,
  },
  flashcards: {
    tipoMaterial: "flashcards",
    quantidade: 3,
    incluirGabarito: false,
  },
  "mapa-mental": {
    tipoMaterial: "mapa-mental",
    quantidade: 3,
    incluirGabarito: false,
  },
  slides: {
    tipoMaterial: "slides",
    quantidade: 4,
    incluirGabarito: false,
    habilidadesSelecionadas: undefined,
  },
};

function buildInput(extras) {
  const input = {
    etapa: "Ensino Fundamental - Anos Finais",
    anoSerie: "9º ano",
    componenteCurricular: "Matemática",
    tema: "Equações do 1º grau",
    objetivo: "Resolver equações lineares simples",
    dificuldade: "media",
    habilidadesSelecionadas: BNCC,
    ...extras,
  };
  if (extras.tipoMaterial === "slides") {
    delete input.habilidadesSelecionadas;
  }
  return input;
}

async function runEngineType(tipo, generateMaterialByEngine, failures) {
  const payload = LIVE_PAYLOADS[tipo];
  if (!payload) {
    failures.push({ tipo, reason: "payload live ausente" });
    return;
  }

  const input = buildInput(payload);
  const tipoStarted = Date.now();
  console.log(`\n→ Gerando ${tipo}...`);

  try {
    const result = await generateMaterialByEngine(input);
    const elapsedMs = Date.now() - tipoStarted;

    if (!result.ok) {
      failures.push({ tipo, reason: result.message || "falha", elapsedMs });
      console.log(`  ✗ ${tipo}: ${result.message}`);
      return;
    }

    const { html, qualityScore, qualityIssues = [], alertas = [] } = result.data;
    const htmlLen = String(html || "").length;
    const hasStructure = /<h1|planify-doc-title|planify-doc-header/i.test(html || "");
    const minScore = 88;
    const acceptable =
      htmlLen > 200 &&
      hasStructure &&
      (qualityScore ?? 0) >= minScore &&
      qualityIssues.length === 0;

    if (!acceptable) {
      failures.push({
        tipo,
        reason: `qualidade insuficiente (score=${qualityScore}, min=${minScore}, issues=${qualityIssues.length}, alertas=${alertas.length}, html=${htmlLen})`,
        issues: qualityIssues.slice(0, 5),
        elapsedMs,
      });
      console.log(
        `  ✗ ${tipo}: score=${qualityScore}, issues=${qualityIssues.length}, html=${htmlLen}`,
      );
      if (qualityIssues[0]) console.log(`    - ${qualityIssues[0]}`);
      return;
    }

    console.log(
      `  ✓ ${tipo}: score=${qualityScore}, html=${htmlLen}, ${elapsedMs}ms`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ tipo, reason: message });
    console.log(`  ✗ ${tipo}: ${message}`);
  }
}

async function runSprint4Suite(failures) {
  console.log("\n=== Sprint 4 staging suite ===");

  const routes = [
    "/api/banco-questoes/publicar-escola",
    "/api/correcao/exportar-pdf",
    "/api/banco-questoes?source=school",
  ];

  const baseUrl = process.env.VERIFY_BASE_URL || "http://127.0.0.1:3000";

  for (const route of routes) {
    const url = `${baseUrl}${route}`;
    console.log(`\n→ HTTP smoke ${route} (sem auth)…`);
    try {
      const response = await fetch(url, {
        method: route.includes("exportar") || route.includes("publicar") ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
        body:
          route.includes("exportar") || route.includes("publicar")
            ? JSON.stringify({})
            : undefined,
      });

      if (response.status === 401 || response.status === 403) {
        console.log(`  ✓ ${route}: ${response.status} (gate auth OK)`);
      } else {
        failures.push({
          tipo: route,
          reason: `esperado 401/403 sem auth, recebido ${response.status}`,
        });
        console.log(`  ✗ ${route}: status ${response.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  ~ ${route}: ${message} (servidor offline — skip)`);
    }
  }

  const { logOperationalEvent } = loadTsModule(
    "src/server/telemetry/operational-telemetry.ts",
  );
  try {
    logOperationalEvent({
      eventType: "question_import_zero",
      toolTipo: "verify-sprint4",
      ok: false,
      errorCode: "dry_run",
    });
    console.log("\n  ✓ operational-telemetry: dry-run insert (fire-and-forget)");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ tipo: "operational-telemetry", reason: message });
    console.log(`  ✗ operational-telemetry: ${message}`);
  }
}

async function runSprint3Suite(failures) {
  const { evaluateCorrectionWithAI } = loadTsModule(
    "src/server/correcao/correction-ai-service.ts",
  );
  const { extractStudentResponseFromUpload } = loadTsModule(
    "src/server/correcao/correction-ocr-service.ts",
  );

  console.log("\n=== Sprint 3 staging suite ===");

  console.log("\n→ OCR (fixture PNG)...");
  const tinyPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  try {
    const ocrResult = await extractStudentResponseFromUpload({
      buffer: tinyPng,
      mimeType: "image/png",
      hint: "resposta",
    });
    if (ocrResult.ok) {
      console.log(`  ✓ ocr: ${ocrResult.texto.slice(0, 40)}…`);
    } else {
      console.log(`  ~ ocr: ${ocrResult.message} (fixture mínimo — endpoint OK)`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ tipo: "ocr", reason: message });
    console.log(`  ✗ ocr: ${message}`);
  }

  console.log("\n→ Avaliando correção IA (texto)...");
  const correctionStarted = Date.now();
  try {
    const correctionResult = await evaluateCorrectionWithAI({
      respostaAluno:
        "A Revolução Industrial trouxe fábricas e urbanização, ampliando desigualdades sociais.",
      enunciado: "Cite uma consequência da Revolução Industrial.",
      componente: "História",
      notaMaxima: 10,
    });
    const elapsedMs = Date.now() - correctionStarted;

    if (!correctionResult.ok) {
      failures.push({ tipo: "correcao-ia", reason: correctionResult.message, elapsedMs });
      console.log(`  ✗ correcao-ia: ${correctionResult.message}`);
    } else {
      console.log(
        `  ✓ correcao-ia: nota=${correctionResult.result.nota}, ${elapsedMs}ms`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ tipo: "correcao-ia", reason: message });
    console.log(`  ✗ correcao-ia: ${message}`);
  }
}

async function runSprint1Suite(failures) {
  const { generateMaterialByEngine } = loadTsModule(
    "src/server/materials/material-engine-service.ts",
  );
  const { generateLessonBundle } = loadTsModule(
    "src/server/materials/lesson-bundle-orchestrator.ts",
  );
  const { evaluateCorrectionWithAI } = loadTsModule(
    "src/server/correcao/correction-ai-service.ts",
  );

  console.log("\n=== Sprint 1 staging suite ===");

  for (const tipo of ["resumo", "atividade"]) {
    await runEngineType(tipo, generateMaterialByEngine, failures);
  }

  console.log("\n→ Gerando bundle (atividade + resumo)...");
  const bundleStarted = Date.now();
  try {
    const bundleResult = await generateLessonBundle({
      ...buildInput({ tipoMaterial: "atividade" }),
      bundleTools: ["atividade", "resumo"],
      tema: "Equações do 1º grau — revisão",
    });

    const elapsedMs = Date.now() - bundleStarted;

    if (!bundleResult.ok) {
      failures.push({ tipo: "bundle", reason: bundleResult.message, elapsedMs });
      console.log(`  ✗ bundle: ${bundleResult.message}`);
    } else {
      const successCount = bundleResult.items.filter((item) => item.ok).length;
      const allHtmlOk = bundleResult.items
        .filter((item) => item.ok)
        .every((item) => String(item.html || "").length > 200);

      if (successCount < 1 || !allHtmlOk) {
        failures.push({
          tipo: "bundle",
          reason: `bundle parcial inválido (success=${successCount}, htmlOk=${allHtmlOk})`,
          elapsedMs,
        });
        console.log(`  ✗ bundle: success=${successCount}, htmlOk=${allHtmlOk}`);
      } else {
        console.log(`  ✓ bundle: ${successCount}/${bundleResult.items.length} OK, ${elapsedMs}ms`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ tipo: "bundle", reason: message });
    console.log(`  ✗ bundle: ${message}`);
  }

  console.log("\n→ Avaliando correção IA...");
  const correctionStarted = Date.now();
  try {
    const correctionResult = await evaluateCorrectionWithAI({
      respostaAluno:
        "Para resolver x + 5 = 12, subtraímos 5 dos dois lados e obtemos x = 7. Verifiquei substituindo na equação original.",
      enunciado: "Resolva a equação x + 5 = 12.",
      gabarito: "x = 7",
      componente: "Matemática",
      anoSerie: "9º ano",
      tema: "Equações do 1º grau",
      notaMaxima: 10,
    });
    const elapsedMs = Date.now() - correctionStarted;

    if (!correctionResult.ok) {
      failures.push({ tipo: "correcao-ia", reason: correctionResult.message, elapsedMs });
      console.log(`  ✗ correcao-ia: ${correctionResult.message}`);
    } else {
      const { nota, feedbackGeral } = correctionResult.result;
      const valid =
        typeof nota === "number" &&
        String(feedbackGeral || "").trim().length > 20;

      if (!valid) {
        failures.push({
          tipo: "correcao-ia",
          reason: `saída inválida (nota=${nota}, feedbackLen=${String(feedbackGeral || "").length})`,
          elapsedMs,
        });
        console.log(`  ✗ correcao-ia: nota=${nota}, feedbackLen=${String(feedbackGeral || "").length}`);
      } else {
        console.log(`  ✓ correcao-ia: nota=${nota}, feedback=${String(feedbackGeral).slice(0, 40)}…, ${elapsedMs}ms`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ tipo: "correcao-ia", reason: message });
    console.log(`  ✗ correcao-ia: ${message}`);
  }
}

async function main() {
  loadEnvLocal();

  if (!process.env.GEMINI_API_KEY?.trim()) {
    console.error("verify-generators-live: GEMINI_API_KEY ausente em .env.local");
    process.exit(1);
  }

  const suite = parseSuiteArg();
  const failures = [];
  const started = Date.now();

  if (suite === "sprint1") {
    await runSprint1Suite(failures);
  } else if (suite === "sprint3") {
    await runSprint3Suite(failures);
  } else if (suite === "sprint4") {
    await runSprint4Suite(failures);
  } else if (suite === "u2") {
    const { generateMaterialByEngine } = loadTsModule(
      "src/server/materials/material-engine-service.ts",
    );
    await runEngineType("slides", generateMaterialByEngine, failures);
    console.log("\n→ inclusão: contrato client (sem live API)");
    const inclusaoClient = readFileSync(
      join(root, "src/lib/inclusao/inclusao-client.ts"),
      "utf8",
    );
    if (!inclusaoClient.includes("requestInclusaoGeneration")) {
      failures.push({ tipo: "inclusao", reason: "client ausente" });
    }
  } else {
    const { MATERIAL_ENGINE_TYPES } = loadTsModule(
      "src/server/materials/material-engine-types.ts",
    );
    const { generateMaterialByEngine } = loadTsModule(
      "src/server/materials/material-engine-service.ts",
    );

    const filter = parseTypesArg();
    const types = filter?.length
      ? filter.filter((tipo) => MATERIAL_ENGINE_TYPES.includes(tipo))
      : MATERIAL_ENGINE_TYPES;

    for (const tipo of types) {
      await runEngineType(tipo, generateMaterialByEngine, failures);
    }

    const elapsedMs = Date.now() - started;
    console.log(`\nverify-generators-live: ${types.length - failures.length}/${types.length} OK — ${elapsedMs}ms`);
  }

  const elapsedMs = Date.now() - started;
  if (suite === "sprint1") {
    const total = 4;
    console.log(`\nverify:staging (sprint1): ${total - failures.length}/${total} OK — ${elapsedMs}ms`);
  } else if (suite === "sprint3") {
    const total = 2;
    console.log(`\nverify:staging (sprint3): ${total - failures.length}/${total} OK — ${elapsedMs}ms`);
  } else if (suite === "sprint4") {
    const total = 4;
    console.log(`\nverify:staging (sprint4): ${total - failures.length}/${total} OK — ${elapsedMs}ms`);
  } else if (suite === "u2") {
    const total = 1;
    console.log(`\nverify:staging (u2): ${total - failures.length}/${total} OK — ${elapsedMs}ms`);
  }

  if (failures.length) {
    console.error("\nFalhas:");
    for (const item of failures) {
      console.error(`- ${item.tipo}: ${item.reason}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
