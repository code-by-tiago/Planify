/**
 * Gate do ecossistema pedagógico — P1 + P2 + P3 + P4 estáticos.
 * Run: npm run verify:pedagogical-ecosystem
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function mustExist(rel) {
  const full = join(root, rel);
  assert.ok(existsSync(full), `missing: ${rel}`);
  return full;
}

function runStep(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });

  assert.equal(
    result.status,
    0,
    `${[command, ...args].join(" ")} failed`,
  );
}

// P1
runStep("npm", ["run", "verify:pedagogical-p1"]);

// P2
mustExist("src/server/pedagogical-cache/adapters/wikipedia-pt-adapter.ts");
mustExist("src/server/pedagogical-cache/scrape-orchestrator.ts");
mustExist("src/server/pedagogical-cache/robots-policy.ts");
mustExist("src/server/pedagogical-cache/format-pedagogical-snippet.ts");
mustExist("src/app/api/pedagogico/buscar/route.ts");

const wiki = readFileSync(
  join(root, "src/server/pedagogical-cache/adapters/wikipedia-pt-adapter.ts"),
  "utf8",
);
assert.match(wiki, /USER_AGENT/);
assert.match(wiki, /pt\.wikipedia\.org/);

const orchestrator = readFileSync(
  join(root, "src/server/pedagogical-cache/scrape-orchestrator.ts"),
  "utf8",
);
assert.match(orchestrator, /12_000|12000/);

// P3
runStep("npm", ["run", "verify:pedagogical-p3"]);

// P4
mustExist("src/app/api/admin/pedagogico/fila/route.ts");
mustExist("src/app/api/admin/pedagogico/[id]/revisar/route.ts");
mustExist("src/app/api/cron/pedagogico/refresh/route.ts");
mustExist("src/app/api/cron/pedagogico/ingest/route.ts");
mustExist("docs/pedagogical-cache-adapters.md");
mustExist("docs/ai-cost-strategy.md");
mustExist("src/server/pedagogical-cache/adapters/oer-stub-adapter.ts");
mustExist("src/server/pedagogical-cache/pedagogical-match-confidence.ts");
mustExist("src/server/pedagogical-cache/enrich-with-pedagogical-context.ts");

const cron = readFileSync(
  join(root, "src/app/api/cron/pedagogico/refresh/route.ts"),
  "utf8",
);
assert.match(cron, /CRON_SECRET/);

const ingest = readFileSync(
  join(root, "src/app/api/cron/pedagogico/ingest/route.ts"),
  "utf8",
);
assert.match(ingest, /CRON_SECRET/);
assert.match(ingest, /scrapePedagogicalSources/);

const resolver = readFileSync(
  join(root, "src/server/pedagogical-cache/pedagogical-context-resolver.ts"),
  "utf8",
);
assert.match(resolver, /filterEntriesByConfidence/);
assert.match(resolver, /pedagogical_inject_skipped/);

const confidence = readFileSync(
  join(root, "src/server/pedagogical-cache/pedagogical-match-confidence.ts"),
  "utf8",
);
assert.match(confidence, /TOKEN_OVERLAP_THRESHOLD/);
assert.match(confidence, /bnccOverlap/);

const materialAi = readFileSync(
  join(root, "src/server/ai/material-ai-service.ts"),
  "utf8",
);
assert.match(materialAi, /resolveDisciplineTopicGuidance/);
assert.match(materialAi, /buildSuggestionFromDisciplineSeed/);

const pkg = readFileSync(join(root, "package.json"), "utf8");
assert.match(pkg, /verify:pedagogical-p1/);
assert.match(pkg, /verify:pedagogical-ecosystem/);
assert.match(pkg, /backfill:pedagogical-bncc/);
assert.match(pkg, /seed:pedagogical-miss-queue/);

console.log("verify:pedagogical-ecosystem: OK (Reservatório Didático 2.0)");
