#!/usr/bin/env node
/**
 * Smoke checks for annual→trimestral planning consonance wiring.
 * Trimestrais são sempre extraídos do anual (sem geração standalone).
 * Run: node scripts/verify-planning-consonancia.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
let failed = 0;

const requiredSnippets = [
  {
    file: "src/lib/planejamentos/planning-trimestral-from-annual.ts",
    includes: [
      "buildTrimestralPlansFromAnnual",
      "extractAnnualItemsForTrimester",
      "resolveMatrixForDocument",
    ],
  },
  {
    file: "src/server/planejamentos/official-planning-docx.ts",
    includes: ["resolveMatrixForDocument", "buildOfficialPlanningDocx"],
  },
  {
    file: "src/app/planejamentos/PlanejamentosClient.tsx",
    includes: [
      "buildTrimestralPlansFromAnnual",
      "pacoteTrimestralAnual",
      "Extrair trimestres do anual",
    ],
  },
  {
    file: "src/server/planejamentos/planning-validation.ts",
    includes: [
      "O planejamento trimestral é gerado a partir do anual",
    ],
  },
  {
    file: "src/server/bncc/validate-bncc-codes-against-db.ts",
    includes: ["filterBnccCodesAgainstDb", "filterHabilidadesSelecionadasAgainstDb"],
  },
  {
    file: "src/lib/planejamentos/planning-official-editor-html-client.ts",
    includes: ["resolvePlanningEditorHtml", "official-docx"],
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

// Soft consonance (annualContext) não deve mais alimentar o fluxo principal.
const clientPath = join(root, "src/app/planejamentos/PlanejamentosClient.tsx");
if (existsSync(clientPath)) {
  const client = readFileSync(clientPath, "utf8");
  if (client.includes("annualContext")) {
    console.error(
      "UNEXPECTED: PlanejamentosClient ainda injeta annualContext (fluxo trimestral standalone)",
    );
    failed += 1;
  }
  if (client.includes('updateField("tipoPlanejamento", "trimestral")')) {
    console.error(
      "UNEXPECTED: UI ainda permite selecionar Planejamento Trimestral standalone",
    );
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`\nverify:planning-consonancia FAILED (${failed} checks)`);
  process.exit(1);
}

console.log("verify:planning-consonancia OK (anual → extração trimestral)");
