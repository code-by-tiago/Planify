/**
 * Verificação estática Sprint U4 — histórico, copy, retry prova/lista.
 * Run: npm run verify:unification-u4
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "src/app/historico/HistoricoClient.tsx",
  "src/components/documents/HistoryDocumentExportBar.tsx",
  "src/server/materials/exam-questions-retry.ts",
  "src/app/api/materiais/regenerar-questoes/route.ts",
  "src/lib/materiais/material-exam-retry-client.ts",
];

for (const file of requiredFiles) {
  assert.ok(existsSync(join(root, file)), `arquivo ausente: ${file}`);
}

const historicoSource = readFileSync(
  join(root, "src/app/historico/HistoricoClient.tsx"),
  "utf8",
);
assert.match(historicoSource, /formatGenerationError/);
assert.match(historicoSource, /GenerationErrorBanner/);
assert.match(historicoSource, /HistoryDocumentExportBar/);
assert.match(historicoSource, /handleExportError/);

const exportBarSource = readFileSync(
  join(root, "src/components/documents/HistoryDocumentExportBar.tsx"),
  "utf8",
);
assert.match(exportBarSource, /onError/);

const materiaisSource = readFileSync(
  join(root, "src/app/materiais/MateriaisClient.tsx"),
  "utf8",
);
assert.match(materiaisSource, /requestExamQuestionsRetry/);
assert.match(materiaisSource, /regenerarQuestoesFracas/);
assert.doesNotMatch(materiaisSource, /requestSlideImagesRetry/);

const navigationSource = readFileSync(join(root, "src/lib/navigation.ts"), "utf8");
const futuroHighlights = navigationSource.match(
  /highlights:\s*\[[^\]]*futuro[^\]]*\]/gi,
);
assert.equal(
  futuroHighlights?.length ?? 0,
  0,
  `highlights ainda contêm "futuro": ${futuroHighlights?.join(", ") || ""}`,
);

const retryRoute = readFileSync(
  join(root, "src/app/api/materiais/regenerar-questoes/route.ts"),
  "utf8",
);
assert.match(retryRoute, /regenerateWeakExamQuestions/);
assert.match(retryRoute, /creditCost:\s*0/);
assert.doesNotMatch(retryRoute, /spendCredits|insufficient_credits|retryCost/);

console.log("verify-unification-u4: OK");
