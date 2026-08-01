/**
 * Seed idempotente de questões da comunidade (Sprint 3).
 * Run: npm run seed:community-questions
 *
 * Requer SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * Opcional: PLANIFY_OWNER_USER_ID (conta curadora)
 */
import { createClient } from "@supabase/supabase-js";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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
    if (specifier.startsWith("@/")) {
      const rel = `src/${specifier.slice(2)}`;
      for (const candidate of [`${rel}.ts`, `${rel}.tsx`]) {
        try {
          readFileSync(join(root, candidate));
          return loadTsModule(candidate);
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
  return module.exports;
}

loadEnvLocal();

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const ownerUserId = process.env.PLANIFY_OWNER_USER_ID?.trim();
if (!ownerUserId) {
  console.warn(
    "PLANIFY_OWNER_USER_ID não definido — buscando primeiro perfil is_owner/is_admin.",
  );
}

const { COMMUNITY_QUESTION_SEEDS } = loadTsModule(
  "src/server/banco-questoes/question-bank-service.ts",
);
const { computeQuestionContentHash } = loadTsModule(
  "src/lib/banco-questoes/question-bank-hash.ts",
);

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function resolveOwnerId() {
  if (ownerUserId) return ownerUserId;

  const { data: owner } = await supabase
    .from("profiles")
    .select("id")
    .or("is_owner.eq.true,is_admin.eq.true")
    .limit(1)
    .maybeSingle();

  if (owner?.id) return owner.id;

  const { data: anyProfile } = await supabase
    .from("profiles")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (!anyProfile?.id) {
    throw new Error("Nenhum perfil encontrado para atribuir seeds.");
  }

  return anyProfile.id;
}

async function main() {
  const userId = await resolveOwnerId();
  let inserted = 0;
  let skipped = 0;

  for (const seed of COMMUNITY_QUESTION_SEEDS) {
    const contentHash = computeQuestionContentHash(seed.enunciado, seed.tipo);

    const { data: existing } = await supabase
      .from("question_bank_items")
      .select("id")
      .eq("user_id", userId)
      .eq("content_hash", contentHash)
      .maybeSingle();

    if (existing?.id) {
      skipped += 1;
      continue;
    }

    const now = new Date().toISOString();
    const { error } = await supabase.from("question_bank_items").insert({
      user_id: userId,
      enunciado: seed.enunciado,
      tipo: seed.tipo,
      alternativas: seed.alternativas,
      resposta_esperada: seed.respostaEsperada,
      criterio_correcao: seed.criterioCorrecao,
      componente: seed.componente,
      ano_serie: seed.anoSerie,
      etapa: seed.etapa,
      tema: seed.tema,
      bncc_codigos: seed.bnccCodigos,
      tags: seed.tags,
      source_title: seed.sourceTitle ?? "Planify Curadoria",
      source_type: "seed",
      content_hash: contentHash,
      visibility: "community",
      is_published: true,
      published_at: now,
      author_display_name: seed.authorName ?? "Planify Curadoria",
      usage_count: 0,
      created_at: now,
      updated_at: now,
    });

    if (error) {
      console.error("Falha ao inserir seed:", seed.id, error.message);
      process.exitCode = 1;
      continue;
    }

    inserted += 1;
  }

  console.log(
    `seed:community-questions OK — ${inserted} inserida(s), ${skipped} já existente(s).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
