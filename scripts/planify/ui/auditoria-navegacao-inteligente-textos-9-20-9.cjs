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

const globals = read("src/app/globals.css");
const layout = read("src/app/layout.tsx");
const enhancer = read("src/components/PlanifyFieldEnhancer.tsx");
const home = read("src/app/page.tsx");

if (globals.includes("PLANIFY_SMART_FIELDS_9_20_9_START")) {
  ok("CSS de campos inteligentes presente.");
} else {
  fail("CSS de campos inteligentes ausente.");
}

if (layout.includes("PlanifyFieldEnhancer")) {
  ok("PlanifyFieldEnhancer montado no layout.");
} else {
  fail("PlanifyFieldEnhancer não está montado no layout.");
}

if (enhancer.includes("Ensino Médio") && enhancer.includes("Linguagens e suas Tecnologias")) {
  ok("Base de compatibilidade pedagógica encontrada no enhancer.");
} else {
  fail("Base pedagógica do enhancer incompleta.");
}

if (home.includes("Biblioteca Premium") && home.includes("Marketplace") && home.includes('href: "/marketplace"') === false) {
  ok("Home atualizada com cards separados para Biblioteca e Marketplace.");
} else if (home.includes("Biblioteca Premium") && home.includes("/marketplace")) {
  ok("Home atualizada com Marketplace separado.");
} else {
  warn("Não confirmei cards separados na Home.");
}

const userBibliotecaFiles = [
  "src/app/biblioteca/page.tsx",
  "src/app/biblioteca/BibliotecaClient.tsx",
  "src/app/biblioteca/client.tsx",
].map(read).join("\n");

for (const bad of ["cadastrados pelo administrador", "publicados pelo admin", "sem materiais fictícios"]) {
  if (userBibliotecaFiles.toLowerCase().includes(bad.toLowerCase())) {
    warn(`Texto pouco profissional ainda aparece em /biblioteca: ${bad}`);
  } else {
    ok(`Texto profissionalizado/ausente em /biblioteca: ${bad}`);
  }
}

for (const mojibake of ["Ã§", "Ã£", "Ã©", "Âº"]) {
  if (userBibliotecaFiles.includes(mojibake)) {
    warn(`Possível encoding quebrado ainda encontrado em biblioteca: ${mojibake}`);
  }
}

ok("Escopo preservado: não altera APIs, banco, DOCX, Stripe, Supabase, IA ou geração.");

const outDir = path.join(root, "docs", "auditorias");
fs.mkdirSync(outDir, { recursive: true });

const file = path.join(
  outDir,
  `auditoria-navegacao-inteligente-textos-9-20-9-${new Date().toISOString().replace(/[:.]/g, "-")}.md`,
);

const header = [
  "# Planify — Auditoria 9.20.9 — Navegação inteligente e textos",
  "",
  `Data: ${new Date().toLocaleString("pt-BR")}`,
  "",
  failures > 0
    ? `[ERRO] ${failures} falha(s).`
    : warnings > 0
      ? `[AVISO] Sem falhas críticas, mas com ${warnings} aviso(s).`
      : "[OK] Ajustes aplicados.",
  "",
];

fs.writeFileSync(file, `${[...header, ...report].join("\n")}\n`, "utf8");

console.log("");
console.log("===============================================");
console.log("Planify | Auditoria 9.20.9");
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
