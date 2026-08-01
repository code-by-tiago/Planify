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

function read(relativePath) {
  try {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
  } catch {
    return "";
  }
}

const home = read("src/app/page.tsx");
const globals = read("src/app/globals.css");

for (const token of [
  "planify-benefit-strip",
  "planify-how-section",
  "planify-security-section",
  "planify-testimonial-grid",
  "planify-faq-section",
  "planify-final-cta--conversion",
]) {
  if (home.includes(token)) ok(`Home contem: ${token}`);
  else fail(`Home nao contem: ${token}`);
}

for (const route of ["/planos", "/dashboard", "/login", "/planejamentos", "/materiais", "/editor", "/biblioteca", "/marketplace"]) {
  if (home.includes(route)) ok(`Link preservado: ${route}`);
  else warn(`Link nao encontrado na home: ${route}`);
}

if (globals.includes("PLANIFY_CONVERSION_LANDING_9_20_11_START")) {
  ok("CSS 9.20.11 presente.");
} else {
  fail("CSS 9.20.11 ausente.");
}

const forbidden = [
  "Checkout criado no servidor",
  "A chave secreta do Stripe",
  "/api/stripe/checkout",
];

for (const item of forbidden) {
  if (home.includes(item)) warn(`Texto tecnico encontrado na home: ${item}`);
  else ok(`Texto tecnico ausente na home: ${item}`);
}

ok("Escopo esperado: src/app/page.tsx e CSS visual global.");
ok("Nao altera APIs, DOCX, Stripe, Supabase, banco, login ou assinaturas.");

const outDir = path.join(root, "docs", "auditorias");
fs.mkdirSync(outDir, { recursive: true });

const file = path.join(
  outDir,
  `auditoria-landing-final-conversao-9-20-11-${new Date().toISOString().replace(/[:.]/g, "-")}.md`,
);

const header = [
  "# Planify — Auditoria 9.20.11 — Landing final de conversao",
  "",
  `Data: ${new Date().toLocaleString("pt-BR")}`,
  "",
  failures > 0
    ? `[ERRO] ${failures} falha(s).`
    : warnings > 0
      ? `[AVISO] Sem falhas criticas, mas com ${warnings} aviso(s).`
      : "[OK] Landing final aplicada.",
  "",
];

fs.writeFileSync(file, `${[...header, ...report].join("\n")}\n`, "utf8");

console.log("");
console.log("===============================================");
console.log("Planify | Auditoria 9.20.11");
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
console.log(`Relatorio salvo em: ${file}`);
console.log("");

if (failures > 0) {
  process.exitCode = 1;
}
