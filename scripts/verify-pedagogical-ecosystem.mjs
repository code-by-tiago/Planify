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

// P1
spawnSync("npm", ["run", "verify:pedagogical-p1"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

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
spawnSync("npm", ["run", "verify:pedagogical-p3"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

// P4
mustExist("src/app/api/admin/pedagogico/fila/route.ts");
mustExist("src/app/api/admin/pedagogico/[id]/revisar/route.ts");
mustExist("src/app/api/cron/pedagogico/refresh/route.ts");
mustExist("docs/pedagogical-cache-adapters.md");
mustExist("src/server/pedagogical-cache/adapters/oer-stub-adapter.ts");

const cron = readFileSync(
  join(root, "src/app/api/cron/pedagogico/refresh/route.ts"),
  "utf8",
);
assert.match(cron, /CRON_SECRET/);

const pkg = readFileSync(join(root, "package.json"), "utf8");
assert.match(pkg, /verify:pedagogical-p1/);
assert.match(pkg, /verify:pedagogical-ecosystem/);
assert.match(pkg, /backfill:pedagogical-bncc/);

console.log("verify:pedagogical-ecosystem: OK (8 cenários estáticos)");
