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
assert.match(orchestrator, /enrichWithPedagogicalContext/);
assert.match(orchestrator, /enrich-with-pedagogical-context/);
assert.match(orchestrator, /enrichInputWithPedagogicalContext/);

const materiais = readFileSync(
  join(root, "src/app/materiais/MateriaisClient.tsx"),
  "utf8",
);
assert.match(materiais, /fetchPedagogicalContext/);
assert.match(materiais, /600/);
assert.match(materiais, /pedagogicalEntries/);
assert.match(materiais, /buildPedagogicalObservacoes/);

const telemetry = readFileSync(
  join(root, "src/server/telemetry/operational-telemetry.ts"),
  "utf8",
);
assert.match(telemetry, /pedagogical_cache_hit/);
assert.match(telemetry, /pedagogical_cache_miss/);
assert.match(telemetry, /pedagogical_format_only/);
assert.match(telemetry, /pedagogical_inject_skipped/);

const admin = readFileSync(
  join(root, "src/app/admin/AdminQualidadePanel.tsx"),
  "utf8",
);
assert.match(admin, /pedagogical/);
assert.match(admin, /Cache didático/);
assert.match(admin, /hitRate|Taxa de hit/);

console.log("verify:pedagogical-p3: OK");
