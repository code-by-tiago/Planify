const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
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

const css = read("src/app/globals.css");

if (!css) {
  fail("src/app/globals.css não encontrado.");
} else {
  if (css.includes("PLANIFY_CLEAN_SAAS_9_20_5_START")) {
    ok("Tema clean 9.20.5 está presente.");
  } else {
    fail("Tema clean 9.20.5 não está presente.");
  }

  if (!css.includes("PLANIFY_BRAND_THEME_9_20_4_START")) {
    ok("Tema 9.20.4 antigo foi removido.");
  } else {
    warn("Tema 9.20.4 antigo ainda está presente.");
  }

  if (!css.includes("PLANIFY_LIGHT_THEME_9_20_3_START")) {
    ok("Tema 9.20.3 antigo foi removido.");
  } else {
    warn("Tema 9.20.3 antigo ainda está presente.");
  }

  for (const token of [
    "--planify-page",
    "--planify-card",
    "--planify-primary",
    ".planify-brand-logo",
    ".planify-editor-page",
  ]) {
    if (css.includes(token)) {
      ok(`Token visual encontrado: ${token}`);
    } else {
      warn(`Token visual não encontrado: ${token}`);
    }
  }
}

if (exists("src/components/PlanifyBrandLogo.tsx")) {
  ok("PlanifyBrandLogo.tsx presente.");
} else {
  warn("PlanifyBrandLogo.tsx não encontrado.");
}

ok("Escopo esperado: visual global e logo. Não altera APIs, banco, DOCX, Stripe ou lógica de páginas.");

const outDir = path.join(root, "docs", "auditorias");
fs.mkdirSync(outDir, { recursive: true });

const file = path.join(
  outDir,
  `auditoria-interface-clean-9-20-5-${new Date().toISOString().replace(/[:.]/g, "-")}.md`,
);

const header = [
  "# Planify — Auditoria interface clean 9.20.5",
  "",
  `Data: ${new Date().toLocaleString("pt-BR")}`,
  "",
  failures > 0
    ? `[ERRO] ${failures} falha(s).`
    : warnings > 0
      ? `[AVISO] Sem falhas críticas, mas com ${warnings} aviso(s).`
      : "[OK] Interface clean aplicada.",
  "",
];

fs.writeFileSync(file, `${[...header, ...report].join("\n")}\n`, "utf8");

console.log("");
console.log("===============================================");
console.log("Planify | Auditoria interface clean 9.20.5");
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
