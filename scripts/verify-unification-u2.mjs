/**
 * Verificação estática Sprint U2 — materiais stream, retry imagens, inclusão unificada.
 * Run: npm run verify:unification-u2
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "src/app/api/materiais/gerar-stream/route.ts",
  "src/app/api/materiais/regenerar-imagens/route.ts",
  "src/lib/materiais/material-stream-client.ts",
  "src/lib/materiais/material-stream-types.ts",
  "src/server/materials/slide-images-retry.ts",
  "src/app/materiais/MateriaisClient.tsx",
  "src/app/inclusao/InclusaoClient.tsx",
];

for (const file of requiredFiles) {
  assert.ok(existsSync(join(root, file)), `arquivo ausente: ${file}`);
}

const materiaisSource = readFileSync(
  join(root, "src/app/materiais/MateriaisClient.tsx"),
  "utf8",
);
assert.match(materiaisSource, /formatGenerationError/);
assert.match(materiaisSource, /useRetryableAction/);
assert.match(materiaisSource, /requestMaterialGenerationStream/);
assert.match(materiaisSource, /PATIENCE_THRESHOLD_MS/);
assert.match(materiaisSource, /MaterialPreviewSkeleton/);
assert.match(materiaisSource, /GenerationCostHint/);

const inclusaoSource = readFileSync(
  join(root, "src/app/inclusao/InclusaoClient.tsx"),
  "utf8",
);
assert.match(inclusaoSource, /formatGenerationError/);
assert.match(inclusaoSource, /GenerationErrorBanner/);
assert.match(inclusaoSource, /MaterialPreviewSkeleton/);
assert.match(inclusaoSource, /GenerationCostHint/);
assert.doesNotMatch(inclusaoSource, /InclusaoGenerationError/);

const streamRoute = readFileSync(
  join(root, "src/app/api/materiais/gerar-stream/route.ts"),
  "utf8",
);
assert.match(streamRoute, /application\/x-ndjson/);

const retryRoute = readFileSync(
  join(root, "src/app/api/materiais/regenerar-imagens/route.ts"),
  "utf8",
);
assert.match(retryRoute, /0\.5|retryCost/);

console.log("verify-unification-u2: OK");
