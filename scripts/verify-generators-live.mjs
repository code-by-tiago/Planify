/**
 * Geração real via Material Engine (requer GEMINI_API_KEY em .env.local).
 * Run: npm run verify:generators-live
 * Opcional: npm run verify:generators-live -- --types=prova,atividade
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const moduleCache = new Map();
const DEBUG_LOG = join(root, "debug-1b39d8.log");

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

function appendDebugLog(payload) {
  const line = `${JSON.stringify({ sessionId: "1b39d8", timestamp: Date.now(), ...payload })}\n`;
  try {
    readFileSync(DEBUG_LOG);
  } catch {
    // create on append below via write - use appendFileSync from fs
  }
  const { appendFileSync } = require("node:fs");
  appendFileSync(DEBUG_LOG, line, "utf8");
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

async function main() {
  loadEnvLocal();

  if (!process.env.GEMINI_API_KEY?.trim()) {
    console.error("verify-generators-live: GEMINI_API_KEY ausente em .env.local");
    process.exit(1);
  }

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

  const failures = [];
  const started = Date.now();

  for (const tipo of types) {
    const payload = LIVE_PAYLOADS[tipo];
    if (!payload) {
      failures.push({ tipo, reason: "payload live ausente" });
      continue;
    }

    const input = buildInput(payload);
    const tipoStarted = Date.now();
    console.log(`\n→ Gerando ${tipo}...`);

    try {
      const result = await generateMaterialByEngine(input);
      const elapsedMs = Date.now() - tipoStarted;

      if (!result.ok) {
        failures.push({ tipo, reason: result.message || "falha", elapsedMs });
        appendDebugLog({
          location: "verify-generators-live.mjs",
          message: "generation failed",
          hypothesisId: "LIVE",
          data: { tipo, ok: false, reason: result.message, elapsedMs },
          runId: "live",
        });
        console.log(`  ✗ ${tipo}: ${result.message}`);
        continue;
      }

      const { html, qualityScore, qualityIssues = [], alertas = [] } = result.data;
      const htmlLen = String(html || "").length;
      const hasTitle = /<h1|planify-doc-title/i.test(html || "");
      const acceptable =
        htmlLen > 200 &&
        hasTitle &&
        (qualityScore ?? 0) >= 55 &&
        (qualityIssues.length === 0 || (alertas.length > 0 && qualityScore >= 55));

      appendDebugLog({
        location: "verify-generators-live.mjs",
        message: "generation result",
        hypothesisId: "LIVE",
        data: {
          tipo,
          ok: true,
          htmlLen,
          qualityScore,
          issueCount: qualityIssues.length,
          alertaCount: alertas.length,
          acceptable,
          elapsedMs,
        },
        runId: "live",
      });

      if (!acceptable) {
        failures.push({
          tipo,
          reason: `qualidade insuficiente (score=${qualityScore}, issues=${qualityIssues.length}, html=${htmlLen})`,
          issues: qualityIssues.slice(0, 5),
          elapsedMs,
        });
        console.log(
          `  ✗ ${tipo}: score=${qualityScore}, issues=${qualityIssues.length}, html=${htmlLen}`,
        );
        if (qualityIssues[0]) console.log(`    - ${qualityIssues[0]}`);
        continue;
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

  const elapsedMs = Date.now() - started;
  console.log(`\nverify-generators-live: ${types.length - failures.length}/${types.length} OK — ${elapsedMs}ms`);

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
