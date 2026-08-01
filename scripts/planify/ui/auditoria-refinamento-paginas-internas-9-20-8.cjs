const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const globalsPath = path.join(root, "src", "app", "globals.css");

let failures = 0;
let warnings = 0;
const report = [];

function ok(message) {
  report.push(`[OK] ${message}`);
}

function warn(message) {
  warnings += 1;
  report.push(`[AVISO] ${message}`);
}

function fail(message) {
  failures += 1;
  report.push(`[ERRO] ${message}`);
}

function read(file) {
  try {
    return fs.readFileSync(path.join(root, file), "utf8");
  } catch {
    return "";
  }
}

const css = read("src/app/globals.css");

if (css.includes("PLANIFY_INTERNAL_REFINEMENT_9_20_8_START")) {
  ok("Bloco de refinamento interno 9.20.8 está presente.");
} else {
  fail("Bloco de refinamento interno 9.20.8 não encontrado.");
}

for (const token of [
  "--pl-internal-page",
  "--pl-internal-card",
  "--pl-internal-primary",
  ".planify-editor-page",
  "body header",
  "body input",
]) {
  if (css.includes(token)) {
    ok(`Token visual encontrado: ${token}`);
  } else {
    warn(`Token visual não encontrado: ${token}`);
  }
}

ok("Escopo esperado: apenas CSS global visual.");
ok("Não há alteração esperada em APIs, DOCX, Stripe, Supabase, BNCC, Biblioteca, Marketplace ou Admin lógico.");

const outDir = path.join(root, "docs", "auditorias");
fs.mkdirSync(outDir, { recursive: true });

const file = path.join(
  outDir,
  `auditoria-refinamento-paginas-internas-9-20-8-${new Date().toISOString().replace(/[:.]/g, "-")}.md`,
);

const header = [
  "# Planify — Auditoria 9.20.8 — Refinamento páginas internas",
  "",
  `Data: ${new Date().toLocaleString("pt-BR")}`,
  "",
  failures > 0
    ? `[ERRO] ${failures} falha(s).`
    : warnings > 0
      ? `[AVISO] Sem falhas críticas, mas com ${warnings} aviso(s).`
      : "[OK] Refinamento visual aplicado.",
  "",
];

fs.writeFileSync(file, `${[...header, ...report].join("\n")}\n`, "utf8");

console.log("");
console.log("===============================================");
console.log("Planify | Auditoria 9.20.8");
console.log("===============================================");
console.log("");
console.log(
  failures > 0
    ? `Resultado: FALHAS (${failures}) E AVISOS (${warnings})`
    : warnings > 0
      ? `Resultado: OK COM AVISOS (${warnings})`
      : "Resultado: OK"
);
console.log("");
console.log(`Relatório salvo em: ${file}`);
console.log("");

if (failures > 0) {
  process.exitCode = 1;
}
