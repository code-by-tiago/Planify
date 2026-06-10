/**
 * Verificação estática Sprint P3 — integração geração + UI + telemetria.
 * Run: npm run verify:pedagogical-p3
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const orchestrator = readFileSync(
  join(root, "src/server/materials/material-generation-orchestrator.ts"),
  "utf8",
);
assert.match(orchestrator, /resolvePedagogicalContext/);
assert.match(orchestrator, /appendPedagogicalContext/);
assert.match(orchestrator, /enrichInputWithPedagogicalContext/);

const materiais = readFileSync(
  join(root, "src/app/materiais/MateriaisClient.tsx"),
  "utf8",
);
assert.match(materiais, /Contexto verificado/);
assert.match(materiais, /fetchPedagogicalContext/);
assert.match(materiais, /600/);
assert.match(materiais, /sem custo de IA/i);

const telemetry = readFileSync(
  join(root, "src/server/telemetry/operational-telemetry.ts"),
  "utf8",
);
assert.match(telemetry, /pedagogical_cache_hit/);
assert.match(telemetry, /pedagogical_cache_miss/);
assert.match(telemetry, /pedagogical_format_only/);

const admin = readFileSync(
  join(root, "src/app/admin/AdminQualidadePanel.tsx"),
  "utf8",
);
assert.match(admin, /pedagogical/);
assert.match(admin, /Cache didático/);

console.log("verify:pedagogical-p3: OK");
