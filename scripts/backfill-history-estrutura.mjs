/**
 * Injeta estrutura em user_history.raw a partir de generated_materials.
 * Uso:
 *   node scripts/backfill-history-estrutura.mjs --dry-run
 *   node scripts/backfill-history-estrutura.mjs --execute
 *   node scripts/backfill-history-estrutura.mjs --execute --user-id=UUID --limit=500
 */

import { createClient } from "@supabase/supabase-js";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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

const { normalizeMaterialEstrutura } = loadTsModule(
  "src/lib/materiais/normalize-material-estrutura.ts",
);

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const execute = argv.includes("--execute");
  const userIdArg = argv.find((arg) => arg.startsWith("--user-id="));
  const limitArg = argv.find((arg) => arg.startsWith("--limit="));

  return {
    dryRun: dryRun || !execute,
    execute,
    userId: userIdArg ? userIdArg.split("=")[1]?.trim() : null,
    limit: limitArg ? Number(limitArg.split("=")[1]) : 500,
  };
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseRaw(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

function needsPatch(raw) {
  if (!raw || typeof raw !== "object") return false;
  if (raw.estrutura && Array.isArray(raw.estrutura.questoes) && raw.estrutura.questoes.length) {
    return false;
  }
  const serverMaterialId = String(raw.serverMaterialId || "").trim();
  return Boolean(serverMaterialId);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const supabase = getSupabase();
  const limit = Math.min(Math.max(args.limit || 500, 1), 5000);

  let query = supabase
    .from("user_history")
    .select("id, user_id, raw")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (args.userId) {
    query = query.eq("user_id", args.userId);
  }

  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);

  const stats = { patched: 0, skipped: 0, failed: 0 };

  for (const row of rows || []) {
    const raw = parseRaw(row.raw);
    if (!needsPatch(raw)) {
      stats.skipped += 1;
      continue;
    }

    const materialId = String(raw.serverMaterialId).trim();
    const { data: material, error: materialError } = await supabase
      .from("generated_materials")
      .select("id, user_id, response_json")
      .eq("id", materialId)
      .maybeSingle();

    if (materialError || !material) {
      console.warn(`[failed] history=${row.id} material=${materialId} not found`);
      stats.failed += 1;
      continue;
    }

    if (material.user_id && row.user_id && material.user_id !== row.user_id) {
      console.warn(`[failed] history=${row.id} user mismatch`);
      stats.failed += 1;
      continue;
    }

    const { estrutura } = normalizeMaterialEstrutura(material.response_json);
    if (!estrutura) {
      console.warn(`[skipped] history=${row.id} material=${materialId} sem estrutura`);
      stats.skipped += 1;
      continue;
    }

    const nextRaw = { ...raw, estrutura };

    if (args.dryRun) {
      console.log(`[dry-run] would patch history=${row.id} material=${materialId}`);
      stats.patched += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from("user_history")
      .update({ raw: nextRaw })
      .eq("id", row.id);

    if (updateError) {
      console.warn(`[failed] history=${row.id} ${updateError.message}`);
      stats.failed += 1;
      continue;
    }

    console.log(`[patched] history=${row.id} material=${materialId}`);
    stats.patched += 1;
  }

  console.log(
    JSON.stringify(
      {
        mode: args.dryRun ? "dry-run" : "execute",
        userId: args.userId,
        limit,
        ...stats,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
