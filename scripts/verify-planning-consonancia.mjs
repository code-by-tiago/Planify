#!/usr/bin/env node
/**
 * Smoke checks for annual→trimestral planning consonance wiring.
 * Run: node scripts/verify-planning-consonancia.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
let failed = 0;

const requiredSnippets = [
  {
    file: "src/lib/planejamentos/planning-annual-snapshot.ts",
    includes: ["buildPlanningAnnualContextBlock", "PLANNING_ANNUAL_SNAPSHOT_KEY"],
  },
  {
    file: "src/server/planejamentos/planning-ai-service.ts",
    includes: ["annualContext", "PLANNING_RESPONSE_SCHEMA", "PLANNING_PEDAGOGICAL_VOICE"],
  },
  {
    file: "src/app/planejamentos/PlanejamentosClient.tsx",
    includes: ["readPlanningAnnualSnapshot", "annualContext"],
  },
  {
    file: "src/server/bncc/validate-bncc-codes-against-db.ts",
    includes: ["filterBnccCodesAgainstDb", "filterHabilidadesSelecionadasAgainstDb"],
  },
];

for (const check of requiredSnippets) {
  const path = join(root, check.file);
  if (!existsSync(path)) {
    console.error(`MISSING FILE: ${check.file}`);
    failed += 1;
    continue;
  }
  const content = readFileSync(path, "utf8");
  for (const snippet of check.includes) {
    if (!content.includes(snippet)) {
      console.error(`MISSING SNIPPET "${snippet}" in ${check.file}`);
      failed += 1;
    }
  }
}

if (failed > 0) {
  console.error(`\nverify:planning-consonancia FAILED (${failed} checks)`);
  process.exit(1);
}

console.log("verify:planning-consonancia OK");
