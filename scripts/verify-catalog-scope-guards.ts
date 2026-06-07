import { appendFileSync } from "node:fs";
import { applyEducationWithCatalogGuards } from "../src/lib/educacao/catalog-education-guards";

const LOG = "debug-920c67.log";

function log(entry: Record<string, unknown>) {
  const line = JSON.stringify({
    sessionId: "920c67",
    ...entry,
    timestamp: Date.now(),
  });
  appendFileSync(LOG, `${line}\n`);
  console.log(line);
}

const fields = {
  etapa: "Ensino Fundamental",
  anoSerie: "6º ano",
  areaConhecimento: "Ciências Humanas",
  componente: "Geografia",
};

const staleCatalog = {
  grades: ["6º ano"],
  knowledgeAreas: [
    "Linguagens",
    "Matemática",
    "Ciências da Natureza",
    "Ciências Humanas",
    "Ensino Religioso",
  ],
  subjects: ["Geografia", "História"],
};

const staleScope = {
  etapa: "Ensino Fundamental",
  anoSerie: "6º ano",
  areaConhecimento: "Ciências Humanas",
};

const patch = { areaConhecimento: "Ensino Religioso" };

const buggy = (() => {
  const next = { ...fields, ...patch, componente: "Ensino Religioso" };
  if (
    staleCatalog.subjects.length > 0 &&
    !staleCatalog.subjects.includes(next.componente)
  ) {
    next.componente = staleCatalog.subjects[0] || next.componente;
  }
  return next;
})();

const fixed = applyEducationWithCatalogGuards(
  fields,
  patch,
  staleCatalog,
  staleScope,
  false,
);

log({
  hypothesisId: "H1",
  location: "verify-catalog-scope-guards.ts",
  message: "stale catalog area change simulation",
  data: {
    buggyComponente: buggy.componente,
    fixedComponente: fixed.componente,
    fixedArea: fixed.areaConhecimento,
    expected: "Ensino Religioso",
  },
  runId: "post-fix",
});

const ok =
  fixed.componente === "Ensino Religioso" &&
  fixed.areaConhecimento === "Ensino Religioso" &&
  buggy.componente === "Geografia";

if (!ok) {
  console.error("VERIFICATION FAILED", { buggy, fixed });
  process.exit(1);
}

console.log("VERIFICATION PASSED");
