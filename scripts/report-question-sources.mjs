/**
 * Relatório de generated_materials com questões em response_json.
 * Uso: node scripts/report-question-sources.mjs
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
      const candidates = [`${rel}.ts`, `${rel}.tsx`];
      for (const candidate of candidates) {
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

const { countQuestionsInResponseJson } = loadTsModule(
  "src/lib/materiais/normalize-material-estrutura.ts",
);

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

async function main() {
  const supabase = getSupabase();
  const pageSize = 500;
  let offset = 0;
  const byTipo = {};
  let totalMaterials = 0;
  let withQuestions = 0;
  let totalQuestions = 0;

  while (true) {
    const { data, error } = await supabase
      .from("generated_materials")
      .select("id, tipo, response_json")
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;

    for (const row of data) {
      totalMaterials += 1;
      const count = countQuestionsInResponseJson(row.response_json);
      if (count <= 0) continue;

      withQuestions += 1;
      totalQuestions += count;
      const tipo = String(row.tipo || "desconhecido");
      byTipo[tipo] = (byTipo[tipo] || 0) + 1;
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  console.log(
    JSON.stringify(
      {
        totalMaterials,
        withQuestions,
        totalQuestions,
        byTipo,
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
