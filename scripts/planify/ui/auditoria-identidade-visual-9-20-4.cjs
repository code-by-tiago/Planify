const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
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

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  try {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
  } catch {
    return "";
  }
}

if (exists("src/app/globals.css")) {
  const css = read("src/app/globals.css");

  if (css.includes("PLANIFY_BRAND_THEME_9_20_4_START")) {
    ok("Tema visual 9.20.4 está presente em globals.css.");
  } else {
    fail("Tema visual 9.20.4 não está presente em globals.css.");
  }

  for (const token of [
    "--planify-blue",
    "--planify-cyan",
    "--planify-teal",
    ".planify-brand-logo",
    ".planify-editor-page",
  ]) {
    if (css.includes(token)) {
      ok(`Token visual encontrado: ${token}`);
    } else {
      warn(`Token visual não encontrado: ${token}`);
    }
  }
} else {
  fail("src/app/globals.css não encontrado.");
}

if (exists("src/components/PlanifyBrandLogo.tsx")) {
  ok("Componente PlanifyBrandLogo criado.");
} else {
  fail("Componente PlanifyBrandLogo não encontrado.");
}

const componentFiles = [
  "src/components/PageShell.tsx",
  "src/components/Header.tsx",
  "src/components/Navbar.tsx",
  "src/app/layout.tsx",
];

const logoApplied = componentFiles.some((file) => read(file).includes("PlanifyBrandLogo"));

if (logoApplied) {
  ok("PlanifyBrandLogo foi aplicado em um componente de layout/cabeçalho.");
} else {
  warn("PlanifyBrandLogo não foi aplicado automaticamente ao cabeçalho. O CSS ainda estiliza o logo existente.");
}

const outDir = path.join(root, "docs", "auditorias");
fs.mkdirSync(outDir, { recursive: true });

const file = path.join(
  outDir,
  `auditoria-identidade-visual-9-20-4-${new Date().toISOString().replace(/[:.]/g, "-")}.md`,
);

const header = [
  "# Planify — Auditoria identidade visual 9.20.4",
  "",
  `Data: ${new Date().toLocaleString("pt-BR")}`,
  "",
  failures > 0
    ? `[ERRO] ${failures} falha(s).`
    : warnings > 0
      ? `[AVISO] Sem falhas críticas, mas com ${warnings} aviso(s).`
      : "[OK] Identidade visual aplicada.",
  "",
];

fs.writeFileSync(file, `${[...header, ...report].join("\n")}\n`, "utf8");

console.log("");
console.log("===============================================");
console.log("Planify | Auditoria identidade visual 9.20.4");
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
