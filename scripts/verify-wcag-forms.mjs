#!/usr/bin/env node
/**
 * Static WCAG check for primary generation flows (incremental scope):
 * disciplina, série, tema, quantidade in MateriaisClient + PlanejamentosClient.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
let failed = 0;

function fail(message) {
  console.error(`FAIL  ${message}`);
  failed += 1;
}

function ok(message) {
  console.log(`OK    ${message}`);
}

function read(relative) {
  return readFileSync(join(root, relative), "utf8");
}

const checks = [
  {
    file: "src/app/materiais/MateriaisClient.tsx",
    needles: [
      "fieldIdComponente",
      "fieldIdAnoSerie",
      "fieldIdQuantidade",
      'aria-pressed={quantidade === preset.value}',
    ],
    label: "MateriaisClient campos principais (disciplina, série, quantidade)",
  },
  {
    file: "src/app/planejamentos/PlanejamentosClient.tsx",
    needles: [
      "fieldIdComponente",
      "fieldIdAnoSerie",
      "fieldIdConteudos",
      "<TemaCombobox",
    ],
    label: "PlanejamentosClient campos principais (disciplina, série, tema/conteúdos)",
  },
  {
    file: "src/components/bncc/TemaCombobox.tsx",
    needles: ["htmlFor={inputId}", "aria-labelledby={labelId}"],
    label: "TemaCombobox label associado",
  },
  {
    file: "src/lib/pro/hud-form-styles.ts",
    needles: ["focus-visible:ring-2 focus-visible:ring-cyan-400"],
    label: "Chips com focus-visible",
  },
];

for (const check of checks) {
  const source = read(check.file);
  const missing = check.needles.filter((needle) => !source.includes(needle));
  if (missing.length === 0) {
    ok(`${check.label}`);
  } else {
    fail(`${check.file} falta: ${missing.join(", ")}`);
  }
}

if (failed > 0) {
  console.error(`\nverify-wcag-forms: ${failed} falha(s)`);
  process.exit(1);
}

console.log("\nverify-wcag-forms: OK");
