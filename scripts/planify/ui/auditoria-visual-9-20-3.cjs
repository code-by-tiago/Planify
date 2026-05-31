const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const globalsPath = path.join(root, "src", "app", "globals.css");
const report = [];

let failures = 0;
let warnings = 0;

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

function title(message) {
  report.push("");
  report.push(`## ${message}`);
}

title("Clareamento visual");

if (!fs.existsSync(globalsPath)) {
  fail("src/app/globals.css não encontrado.");
} else {
  const css = fs.readFileSync(globalsPath, "utf8");

  if (css.includes("PLANIFY_LIGHT_THEME_9_20_3_START")) {
    ok("Bloco PLANIFY_LIGHT_THEME_9_20_3 encontrado.");
  } else {
    fail("Bloco PLANIFY_LIGHT_THEME_9_20_3 não encontrado.");
  }

  const expectedTokens = [
    "--planify-page",
    "--planify-surface",
    "--planify-text",
    "bg-slate-950",
    "planify-editor-page",
  ];

  for (const token of expectedTokens) {
    if (css.includes(token)) {
      ok(`Token visual presente: ${token}`);
    } else {
      warn(`Token visual não encontrado: ${token}`);
    }
  }
}

title("Escopo");

ok("Etapa 9.20.3 deve alterar apenas src/app/globals.css.");
ok("Não deve alterar APIs, DOCX, Planejamentos, Stripe, Admin, Biblioteca, Marketplace ou Editor lógico.");

const outDir = path.join(root, "docs", "auditorias");
fs.mkdirSync(outDir, { recursive: true });

const file = path.join(
  outDir,
  `auditoria-visual-9-20-3-${new Date().toISOString().replace(/[:.]/g, "-")}.md`,
);

const header = [
  "# Planify — Auditoria visual 9.20.3",
  "",
  `Data: ${new Date().toLocaleString("pt-BR")}`,
  "",
  failures > 0
    ? `[ERRO] ${failures} falha(s).`
    : warnings > 0
      ? `[AVISO] Sem falhas críticas, mas com ${warnings} aviso(s).`
      : "[OK] Clareamento visual aplicado.",
  "",
];

fs.writeFileSync(file, `${[...header, ...report].join("\n")}\n`, "utf8");

console.log("");
console.log("===============================================");
console.log("Planify | Auditoria visual 9.20.3");
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
